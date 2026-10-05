import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { getGitSnapshot } from '../lib/git.js';
import { loadGlobalIndex } from '../lib/index.js';

export async function doctorCommand(opts: { cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  let cliVersion = 'unknown';
  try { cliVersion = JSON.parse(readFileSync(resolve(join(dirname(fileURLToPath(import.meta.url)), '../../package.json')), 'utf8')).version; } catch {}
  let skillVersion = 'unknown';
  const candidates = [
    resolve('skills/continuity/VERSION'),
    resolve(join(dirname(fileURLToPath(import.meta.url)), '../../../VERSION')),
    resolve(join(cwd, 'skills/continuity/VERSION')),
  ];
  for (const p of candidates) { try { skillVersion = readFileSync(p, 'utf8').trim(); break; } catch {} }
  const snap = getGitSnapshot(cwd);
  const idx = loadGlobalIndex();
  const harnesses: string[] = [];
  const checks = [
    join(homedir(), '.claude/skills/continuity/SKILL.md'),
    join(homedir(), '.codex/skills/continuity/SKILL.md'),
    join(homedir(), '.config/opencode/skills/continuity/SKILL.md'),
    resolve('.cursor/rules/continuity.mdc'),
  ];
  for (const c of checks) if (existsSync(c)) harnesses.push(c);
  console.log(`CLI version: ${cliVersion}`);
  console.log(`Skill version: ${skillVersion}`);
  console.log(`Harnesses detected: ${harnesses.length ? harnesses.join(', ') : 'none'}`);
  console.log(`Index: ${idx.length} entries at ${join(homedir(), '.continuity/index.json')}`);
  console.log(`Git: ${snap.branch || 'not a repo'} @ ${snap.commit || 'unknown'} cwd=${cwd}`);
  console.log(`Schema: 1.0`);
  if (cliVersion !== skillVersion && skillVersion !== 'unknown') console.warn(`version skew: CLI ${cliVersion} vs skill ${skillVersion}`);
}
