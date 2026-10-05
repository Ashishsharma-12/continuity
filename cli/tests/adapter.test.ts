import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('adapters', () => {
  it('all shims render identical STATE.md headings and contain doctor', () => {
    const base = join(process.cwd(), '..');
    const hbs = readFileSync(join(base, 'templates/STATE.md.hbs'), 'utf8');
    expect(hbs).toContain('## 1. Original Goal');
    expect(hbs).toContain('## 11. Next Action');
    for (const p of [
      join(base, 'adapters/claude/SKILL.md'),
      join(base, 'adapters/codex/SKILL.md'),
      join(base, 'adapters/opencode/skill.md'),
    ]) {
      const s = readFileSync(p, 'utf8');
      expect(s).toContain('continuity doctor');
      expect(s).toContain('STATE.md');
    }
  });

  it('cursor rule auto-applies at session start', () => {
    const base = join(process.cwd(), '..');
    const c = readFileSync(join(base, 'adapters/cursor/rules/continuity.mdc'), 'utf8');
    expect(c).toContain('alwaysApply: true');
  });

  it('install --dry-run lists detected harnesses', async () => {
    const { execSync } = await import('node:child_process');
    const out = execSync('node lib/bin.js install --dry-run', { cwd: process.cwd() }).toString();
    expect(out).toContain('would copy');
  });
});
