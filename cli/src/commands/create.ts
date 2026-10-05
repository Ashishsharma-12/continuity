import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { StateSchema } from '../lib/schema.js';
import { getGitSnapshot, writePatch } from '../lib/git.js';
import { handoffId, atomicWrite, repoHash } from '../lib/io.js';
import { appendIndex } from '../lib/index.js';
import { checkSecrets } from '../lib/validate.js';

function loadTemplate(): string {
  const candidates = [
    resolve(join(dirname(fileURLToPath(import.meta.url)), '../../../templates/STATE.md.hbs')),
    resolve(join(dirname(fileURLToPath(import.meta.url)), '../../templates/STATE.md.hbs')),
    resolve('skills/continuity/templates/STATE.md.hbs'),
    resolve('templates/STATE.md.hbs'),
  ];
  for (const p of candidates) {
    try { return readFileSync(p, 'utf8'); } catch {}
  }
  throw new Error('STATE.md.hbs template not found');
}

export async function createCommand(goal: string, opts: { yes?: boolean; fullPatch?: boolean; cwd?: string; auto?: boolean; allowSecrets?: boolean } = {}) {
  const cwd = opts.cwd || process.cwd();
  const snap: any = getGitSnapshot(cwd);
  const slug = (goal || 'handoff').replace(/\s+/g, '-').slice(0, 40);
  const baseId = handoffId(slug);
  const id = opts.auto ? baseId : baseId;
  const patchPath = `.continuity/${id}/snapshot.patch`;
  const absPatch = resolve(join(cwd, patchPath));
  let patchTrunc = '';
  try {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(resolve(join(cwd, `.continuity/${id}`)), { recursive: true });
    if (!snap.not_a_repo) {
      patchTrunc = writePatch(cwd, absPatch);
      if (!patchTrunc) {
        try { patchTrunc = readFileSync(absPatch, 'utf8').split('\n').slice(0, 200).join('\n'); } catch {}
      }
    }
  } catch {
    patchTrunc = '';
  }
  if (opts.fullPatch) {
    try { patchTrunc = readFileSync(absPatch, 'utf8'); } catch {}
  }
  // truncate to 200 lines for STATE.md preview
  const previewLines = patchTrunc.split('\n').slice(0, 200).join('\n');
  const state: any = {
    schemaVersion: '1.0',
    handoff: {
      id,
      createdAt: new Date().toISOString(),
      sourceHarness: opts.auto ? 'auto-save' : 'opencode',
      sourceModel: '',
      repo: { root: cwd, remote: '', hash: repoHash(cwd) },
      branch: snap.branch || 'unknown',
      commit: snap.commit || 'unknown',
    },
    original_goal: goal && goal.trim().length >= 10 ? goal : 'Continue task — ' + (goal || 'handoff'),
    current_plan: [],
    todos: { done: [], pending: [{ task: goal || 'pending' }], blocked: [] },
    key_decisions: [],
    assumptions: [],
    open_questions: opts.yes || opts.auto ? (opts.auto ? ['Auto-saved — verify next_action before continuing'] : []) : ['Confirm scope?'],
    git_snapshot: {
      stat: snap.stat || '',
      changedFiles: snap.changedFiles || [],
      untracked: snap.untracked || [],
      patchPath,
      patchTruncated: previewLines,
      stashRef: null,
      ...(snap.not_a_repo ? { not_a_repo: true, cwd } : {}),
    },
    verification: { lastCommand: '', status: 'not_run', summary: '', logPath: '' },
    next_action: `Continue at todos.pending[0]: ${goal || 'next step'} — implement and run tests`,
    context_notes: { entryPoints: [], readOrder: `Read .continuity/${id}/STATE.md then git diff --stat` },
    secrets_policy: { ignoredGlobs: ['.env', '*.pem', 'secrets/**', 'agos-dev-readonly-kubeconfig.yaml'], redacted: true },
  };
  if (!opts.allowSecrets) {
    const leak = checkSecrets(previewLines || '', state.secrets_policy.ignoredGlobs);
    if (leak) throw new Error(`secrets_leak: ${leak} — use --allow-secrets to override`);
  } else {
    // redacted preview
    if (previewLines.includes('.env') || previewLines.includes('agos-dev-readonly-kubeconfig')) {
      state.git_snapshot.patchTruncated = '<redacted: secrets>';
    }
  }
  const parsed = StateSchema.safeParse(state);
  if (!parsed.success) {
    throw new Error(`validation failed: ${parsed.error.message}`);
  }
  const template = loadTemplate();
  const hbs = Handlebars.compile(template);
  atomicWrite(join(cwd, `.continuity/${id}/state.json`), JSON.stringify(parsed.data, null, 2));
  atomicWrite(join(cwd, `.continuity/${id}/STATE.md`), hbs(parsed.data));
  await appendIndex({
    id,
    repoHash: repoHash(cwd),
    repoPath: cwd,
    branch: snap.branch || 'unknown',
    commit: snap.commit || 'unknown',
    createdAt: state.handoff.createdAt,
    harness: state.handoff.sourceHarness,
    goalHash: (goal || '').slice(0, 40),
    statePath: `.continuity/${id}/state.json`,
  });
  console.log(`Handoff ${id} ready — in next harness: npx continuity resume ${id}`);
  return id;
}
