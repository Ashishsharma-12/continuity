#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const WINDOW_KEYS = [
  'five_hour',
  'seven_day',
  'seven_day_opus',
  'seven_day_sonnet',
  'seven_day_oauth_apps',
  'seven_day_overage_included',
  'overage',
  'spend_limit',
];

function num(value) {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}

function threshold() {
  const n = num(process.env.CONTINUITY_QUOTA_THRESHOLD);
  return n !== null && n > 0 && n <= 100 ? n : 95;
}

function cacheMaxAgeMs() {
  const n = num(process.env.CONTINUITY_USAGE_CACHE_MS);
  return n !== null && n > 0 ? n : 6 * 60 * 60 * 1000;
}

function refireMs() {
  const n = num(process.env.CONTINUITY_USAGE_REFIRE_MS);
  return n !== null && n > 0 ? n : 30 * 60 * 1000;
}

function backstopEnabled() {
  return process.env.CONTINUITY_PRECOMPACT_BACKSTOP !== '0';
}

function cachePath(root) {
  return path.join(root, '.continuity', '.usage-cache.json');
}

function markerPath(root) {
  return path.join(root, '.continuity', '.usage-watch.json');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function writeJsonAtomic(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data), 'utf8');
    fs.renameSync(tmp, file);
    return true;
  } catch {
    return false;
  }
}

function windowReadout(entry) {
  if (entry === null || entry === undefined) return null;
  if (typeof entry === 'number' || typeof entry === 'string') {
    const pct = num(entry);
    return pct === null ? null : { utilization: pct, resetsAt: null };
  }
  if (typeof entry !== 'object') return null;
  const pct = num(entry.utilization);
  if (pct === null) return null;
  return {
    utilization: pct,
    resetsAt: typeof entry.resets_at === 'string' ? entry.resets_at : null,
  };
}

function contextUsed(payload) {
  const cw = payload && typeof payload === 'object' ? payload.context_window : null;
  if (!cw || typeof cw !== 'object') return null;
  const used = num(cw.used_percentage);
  if (used !== null) return used;
  const remaining = num(cw.remaining_percentage);
  if (remaining !== null) return Math.max(0, Math.min(100, 100 - remaining));
  return null;
}

function extractUsage(payload) {
  const rateLimits = payload && typeof payload === 'object' ? payload.rate_limits : null;
  const windows = [];
  if (rateLimits && typeof rateLimits === 'object') {
    for (const key of WINDOW_KEYS) {
      const readout = windowReadout(rateLimits[key]);
      if (readout) windows.push({ key, ...readout });
    }
  }
  let peak = null;
  for (const w of windows) {
    if (peak === null || w.utilization > peak.utilization) peak = w;
  }
  return {
    windows,
    peak,
    sessionId: (payload && payload.session_id) || null,
    model: (payload && payload.model && payload.model.id) || (payload && payload.model) || null,
    contextUsed: contextUsed(payload),
    observedAt: new Date().toISOString(),
  };
}

function cacheRecord(payload) {
  const rateLimits = payload && typeof payload === 'object' ? payload.rate_limits : null;
  const cw = payload && typeof payload === 'object' ? payload.context_window : null;
  return {
    rate_limits: rateLimits && typeof rateLimits === 'object' ? rateLimits : null,
    session_id: (payload && payload.session_id) || null,
    model: payload && payload.model ? { id: payload.model.id || payload.model.display_name || null } : null,
    context_window:
      cw && typeof cw === 'object'
        ? {
            used_percentage: num(cw.used_percentage),
            remaining_percentage: num(cw.remaining_percentage),
          }
        : null,
    observedAt: new Date().toISOString(),
  };
}

function writeCache(root, source) {
  const file = cachePath(root);
  let payload = source;
  if (typeof source === 'string') {
    try {
      payload = JSON.parse(source);
    } catch {
      return false;
    }
  }
  if (!payload || typeof payload !== 'object') return false;
  const record = cacheRecord(payload);
  const existing = readJson(file);
  if (existing && sameReading(existing, record)) return false;
  return writeJsonAtomic(file, record);
}

function sameReading(a, b) {
  const sig = (r) => {
    const rl = r && r.rate_limits ? r.rate_limits : {};
    const parts = WINDOW_KEYS.map((k) => {
      const w = rl[k];
      if (!w) return `${k}=none`;
      return `${k}=${num(w.utilization) ?? '?'}@${w.resets_at || 'none'}`;
    });
    const cw = (r && r.context_window) || {};
    return `${(r && r.session_id) || ''}|${parts.join(',')}|ctx=${num(cw.used_percentage) ?? num(cw.remaining_percentage) ?? '?'}`;
  };
  return sig(a) === sig(b);
}

function readCache(root) {
  const file = cachePath(root);
  let st;
  try {
    st = fs.statSync(file);
  } catch {
    return null;
  }
  if (Date.now() - st.mtimeMs > cacheMaxAgeMs()) return extractUsage({});
  const payload = readJson(file);
  if (!payload) return null;
  const usage = extractUsage(payload);
  usage.cachedAt = payload.observedAt || null;
  const now = Date.now();
  usage.windows = usage.windows.filter((w) => {
    if (!w.resetsAt) return true;
    const at = Date.parse(w.resetsAt);
    return !Number.isFinite(at) || at > now;
  });
  usage.peak = null;
  for (const w of usage.windows) {
    if (usage.peak === null || w.utilization > usage.peak.utilization) usage.peak = w;
  }
  return usage;
}

function usageForSession(usage, sessionId) {
  if (!usage || !sessionId) return null;
  if (!usage.sessionId || usage.sessionId !== sessionId) return null;
  if (!usage.windows || !usage.windows.length) return null;
  return usage;
}

function goalFromTranscript(transcriptPath) {
  if (!transcriptPath) return null;
  let fd;
  try {
    fd = fs.openSync(transcriptPath, 'r');
  } catch {
    return null;
  }
  try {
    const size = fs.fstatSync(fd).size;
    const span = Math.min(size, 512 * 1024);
    const buf = Buffer.alloc(span);
    fs.readSync(fd, buf, 0, span, size - span);
    const lines = buf.toString('utf8').split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (!line.startsWith('{')) continue;
      let rec;
      try {
        rec = JSON.parse(line);
      } catch {
        continue;
      }
      if (rec.type !== 'user' || rec.isMeta || rec.isSidechain) continue;
      const content = rec.message && rec.message.content;
      let text = '';
      if (typeof content === 'string') text = content;
      else if (Array.isArray(content)) {
        text = content
          .filter((p) => p && p.type === 'text' && typeof p.text === 'string')
          .map((p) => p.text)
          .join(' ');
      }
      text = text
        .replace(/<command-name>[\s\S]*?<\/command-name>/g, ' ')
        .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length < 12) continue;
      if (/^(resume|continue|go on|next|keep going|proceed)/i.test(text)) continue;
      return text.length > 180 ? `${text.slice(0, 177)}...` : text;
    }
    return null;
  } catch {
    return null;
  } finally {
    try {
      fs.closeSync(fd);
    } catch {}
  }
}

function cliArgs(root) {
  const local = path.join(root, 'skills', 'continuity', 'cli', 'lib', 'bin.js');
  if (fs.existsSync(local)) return [process.execPath, [local, 'create']];
  return ['continuity', ['create']];
}

function runCreate(root, goal) {
  const [cmd, base] = cliArgs(root);
  const args = [...base, goal || 'Auto-checkpoint at quota threshold', '--auto', '--yes'];
  const res = spawnSync(cmd, args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 90000,
    windowsHide: true,
    shell: false,
  });
  if (res.error || res.status !== 0) {
    const detail = (res.stderr || (res.error && res.error.message) || '').trim().split('\n')[0];
    return { ok: false, id: null, detail: detail || `exit ${res.status}` };
  }
  const out = (res.stdout || '').trim();
  const m = out.match(/Handoff (\S+) ready/);
  return { ok: true, id: m ? m[1] : null, detail: out };
}

function windowKey(usage) {
  const peak = usage && usage.peak;
  if (!peak) return 'unknown';
  if (!peak.resetsAt) return `${peak.key}:no-reset`;
  const at = Date.parse(peak.resetsAt);
  if (!Number.isFinite(at)) return `${peak.key}:no-reset`;
  return `${peak.key}:${Math.floor(at / 3600000)}`;
}

function loadMarker(root) {
  const marker = readJson(markerPath(root));
  if (!marker || typeof marker !== 'object') return { fired: {} };
  if (!marker.fired || typeof marker.fired !== 'object') marker.fired = {};
  return marker;
}

function markerAgeMs(entry) {
  const at = Date.parse((entry && entry.at) || '');
  return Number.isFinite(at) ? Date.now() - at : Infinity;
}

function saveMarker(root, marker, key, payload) {
  marker.fired[key] = { at: new Date().toISOString(), ...payload };
  const cutoff = Date.now() - Math.max(refireMs(), cacheMaxAgeMs());
  for (const [k, v] of Object.entries(marker.fired)) {
    if (markerAgeMs(v) > cutoff) delete marker.fired[k];
  }
  writeJsonAtomic(markerPath(root), marker);
}

function firedForKey(marker, key) {
  const entry = marker.fired[key];
  return entry && markerAgeMs(entry) < refireMs() ? entry : null;
}

function firedForSession(marker, sessionId) {
  if (!sessionId) return null;
  for (const entry of Object.values(marker.fired)) {
    if (entry && entry.sessionId === sessionId && markerAgeMs(entry) < refireMs()) return entry;
  }
  return null;
}

function checkpoint(root, marker, key, goal, source, extra) {
  const res = runCreate(root, goal);
  saveMarker(root, marker, key, { source, handoffId: res.id, threshold: threshold(), ...extra });
  return res;
}

function evaluate(root, usage, opts = {}) {
  const limit = threshold();
  const peak = usage && usage.peak;
  const reason = [];
  const marker = loadMarker(root);
  const sessionId = opts.sessionId || null;
  let fired = false;

  const priorSession = firedForSession(marker, sessionId);

  if (peak && peak.utilization >= limit) {
    const key = windowKey(usage);
    if (firedForKey(marker, key) || priorSession) {
      reason.push(`quota ${peak.utilization}% >= ${limit}% (${peak.key}) — already checkpointed this session`);
    } else {
      const goal = opts.goal || `Auto-checkpoint: ${peak.key} window at ${Math.round(peak.utilization)}%`;
      const res = checkpoint(root, marker, key, goal, 'quota', {
        sessionId,
        utilization: Math.round(peak.utilization * 10) / 10,
      });
      fired = res.ok;
      reason.push(
        res.ok
          ? `quota ${peak.utilization}% >= ${limit}% (${peak.key}) — handoff ${res.id || 'created'}`
          : `quota ${peak.utilization}% >= ${limit}% (${peak.key}) — create failed: ${res.detail}`
      );
    }
  }

  if (!fired && opts.precompactAuto && backstopEnabled()) {
    const key = `precompact:${sessionId || 'session'}`;
    if (priorSession || firedForKey(marker, key)) {
      reason.push('auto-compact crossed — session already checkpointed');
    } else {
      const goal = opts.goal || 'Auto-checkpoint: auto-compact threshold crossed';
      const res = checkpoint(root, marker, key, goal, 'precompact', { sessionId });
      fired = res.ok;
      reason.push(
        res.ok
          ? `auto-compact crossed — handoff ${res.id || 'created'}`
          : `auto-compact crossed — create failed: ${res.detail}`
      );
    }
  }

  if (!reason.length) {
    if (peak) reason.push(`quota ${peak.utilization}% < ${limit}% (${peak.key}) — no checkpoint`);
    else reason.push('no quota data available — no checkpoint');
  }

  return { fired, reason: reason.join('; '), threshold: limit, usage };
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function projectRoot(start) {
  let dir = path.resolve(start || process.cwd());
  for (let i = 0; i < 12; i++) {
    if (fs.existsSync(path.join(dir, 'skills', 'continuity'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start || process.cwd());
}

function main(argv) {
  const mode = argv[0] || 'check';

  if (mode === 'statusline-feed') {
    writeCache(projectRoot(), readStdin());
    return 0;
  }

  if (mode === 'check') {
    const raw = readStdin();
    let inline = null;
    try {
      inline = extractUsage(JSON.parse(raw));
    } catch {}
    const root = projectRoot();
    const cached = readCache(root);
    const usage = inline && inline.windows.length ? inline : cached;
    process.stdout.write(
      `${JSON.stringify({ threshold: threshold(), source: inline && inline.windows.length ? 'stdin' : 'cache', usage }, null, 2)}\n`
    );
    return 0;
  }

  if (mode === 'hook') {
    const raw = readStdin();
    let payload = {};
    try {
      payload = JSON.parse(raw);
    } catch {}
    const root = projectRoot(payload.cwd);
    const usage = usageForSession(readCache(root), payload.session_id) || { windows: [], peak: null };
    const result = evaluate(root, usage, {
      sessionId: payload.session_id,
      goal: goalFromTranscript(payload.transcript_path),
      precompactAuto: payload.hook_event_name === 'PreCompact' && payload.trigger === 'auto',
    });
    if (result.fired) {
      process.stdout.write(`continuity: ${result.reason}\n`);
    }
    return 0;
  }

  process.stderr.write(`usage-watch: unknown mode "${mode}" (expected statusline-feed | hook | check)\n`);
  return 0;
}

module.exports = {
  extractUsage,
  evaluate,
  goalFromTranscript,
  projectRoot,
  readCache,
  readStdin,
  threshold,
  usageForSession,
  writeCache,
};

if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}
