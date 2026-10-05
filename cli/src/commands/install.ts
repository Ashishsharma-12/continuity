import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

function candidateTargets() {
  return [
    { dest: join(homedir(), '.claude/skills/continuity'), src: 'skills/continuity/skills/continuity/SKILL.md', type: 'skill' },
    { dest: join(homedir(), '.codex/skills/continuity'), src: 'skills/continuity/skills/continuity/SKILL.md', type: 'skill' },
    { dest: join(homedir(), '.config/opencode/skills/continuity'), src: 'skills/continuity/skills/continuity/SKILL.md', type: 'skill' },
    { dest: join(homedir(), '.agents/skills/continuity'), src: 'skills/continuity/skills/continuity/SKILL.md', type: 'skill' },
    { dest: resolve('.cursor/rules'), src: 'skills/continuity/adapters/cursor/rules/continuity.mdc', type: 'mdc' },
  ];
}

export async function installCommand(opts: { harness?: string; dryRun?: boolean; cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  const isDry = !!opts.dryRun;
  const filter = opts.harness && opts.harness !== 'all' ? opts.harness : null;
  const targets = candidateTargets().filter(t => {
    if (!filter) return true;
    return t.dest.toLowerCase().includes(filter.toLowerCase());
  });
  for (const t of targets) {
    const srcPath = resolve(join(cwd, t.src));
    const existsSrc = existsSync(srcPath);
    if (!existsSrc && !isDry) {
      // try alternative: template may be at skills/continuity/skills/continuity vs continuity/skill
      continue;
    }
    const destFile = t.type === 'mdc' ? join(t.dest, 'continuity.mdc') : join(t.dest, 'SKILL.md');
    if (isDry) {
      console.log(`would copy ${t.src} -> ${destFile}`);
      continue;
    }
    try {
      mkdirSync(t.dest, { recursive: true });
      if (existsSrc) copyFileSync(srcPath, destFile);
      console.log(`installed ${destFile}`);
    } catch (e: any) {
      if (!isDry) console.warn(`skip ${t.dest}: ${e.message}`);
    }
  }
  // ensure .continuity in .gitignore
  const giPath = resolve(join(cwd, '.gitignore'));
  try {
    let gi = '';
    try { gi = readFileSync(giPath, 'utf8'); } catch { gi = ''; }
    if (!gi.includes('.continuity/')) {
      if (isDry) console.log('would append .continuity/ to .gitignore');
      else {
        writeFileSync(giPath, gi + (gi.endsWith('\n') ? '' : '\n') + '.continuity/\n', 'utf8');
        console.log('appended .continuity/ to .gitignore');
      }
    }
  } catch {}
}
