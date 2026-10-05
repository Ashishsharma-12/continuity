#!/usr/bin/env node
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const dry = process.argv.includes('--dry-run');
const __dir = dirname(fileURLToPath(import.meta.url));
const root = resolve(join(__dir, '../../..'));

function targetList() {
  return [
    { dest: join(homedir(), '.claude/skills/continuity'), src: join(root, 'skills/continuity/skills/continuity/SKILL.md'), type: 'skill' },
    { dest: join(homedir(), '.codex/skills/continuity'), src: join(root, 'skills/continuity/skills/continuity/SKILL.md'), type: 'skill' },
    { dest: join(homedir(), '.config/opencode/skills/continuity'), src: join(root, 'skills/continuity/skills/continuity/SKILL.md'), type: 'skill' },
    { dest: join(homedir(), '.agents/skills/continuity'), src: join(root, 'skills/continuity/skills/continuity/SKILL.md'), type: 'skill' },
    { dest: resolve(join(root, '.cursor/rules')), src: join(root, 'skills/continuity/adapters/cursor/rules/continuity.mdc'), type: 'mdc' },
  ];
}

for (const t of targetList()) {
  const srcExists = existsSync(t.src);
  const destFile = t.type === 'mdc' ? join(t.dest, 'continuity.mdc') : join(t.dest, 'SKILL.md');
  if (dry) {
    console.log(`would copy ${t.src.replace(root + '\\', '').replace(root + '/', '')} -> ${destFile}`);
    continue;
  }
  try {
    mkdirSync(t.dest, { recursive: true });
    if (srcExists) copyFileSync(t.src, destFile);
    console.log(`installed ${destFile}`);
  } catch (e) {
    console.warn(`skip ${t.dest}: ${e.message}`);
  }
}

const giPath = resolve(join(root, '.gitignore'));
try {
  let gi = '';
  try { gi = readFileSync(giPath, 'utf8'); } catch { gi = ''; }
  if (!gi.includes('.continuity/')) {
    if (dry) console.log('would append .continuity/ to .gitignore');
    else {
      writeFileSync(giPath, gi + (gi.endsWith('\n') ? '' : '\n') + '.continuity/\n', 'utf8');
      console.log('appended .continuity/ to .gitignore');
    }
  } else if (dry) console.log('.continuity/ already in .gitignore');
} catch {}
