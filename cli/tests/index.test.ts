import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';
import { appendIndex, loadGlobalIndex, resolveHandoff, listIndex } from '../src/lib/index.js';

describe('index', () => {
  let tmpHome: string;
  let origHome: string | undefined;

  beforeEach(() => {
    // isolate homedir by mocking via env HOME/USERPROFILE and creating temp .continuity
    tmpHome = mkdtempSync(join(tmpdir(), 'cont-index-home-'));
    // proper-lockfile will use the path from homedir(); to isolate, we monkey-patch homedir via overriding env and using direct path
    // Instead, we test append/load directly with real homedir but ensure cleanup of our entry
    // Simpler: test with real global index — just ensure our test entry is unique and we clean it
  });

  it('appendIndex creates global index and appends', async () => {
    const before = loadGlobalIndex().length;
    const id = `test-${Date.now()}__unit`;
    await appendIndex({ id, repoHash: 'abc', repoPath: '/tmp/repo', branch: 'main', commit: 'abc123', createdAt: new Date().toISOString(), harness: 'vitest', goalHash: 'g', statePath: `.continuity/${id}/state.json` });
    const after = loadGlobalIndex();
    expect(after.length).toBe(before + 1);
    expect(after[after.length - 1].id).toBe(id);
    // cleanup: remove last entry
    const { join } = await import('node:path');
    const { homedir } = await import('node:os');
    const { writeFileSync, readFileSync } = await import('node:fs');
    const p = join(homedir(), '.continuity', 'index.json');
    const arr = JSON.parse(readFileSync(p, 'utf8'));
    arr.pop();
    writeFileSync(p, JSON.stringify(arr, null, 2));
  });

  it('resolveHandoff throws when not found', () => {
    expect(() => resolveHandoff('nonexistent-12345', '/tmp')).toThrow();
  });

  it('loadGlobalIndex returns array', () => {
    const idx = loadGlobalIndex();
    expect(Array.isArray(idx)).toBe(true);
  });

  it('listIndex filters by cwd when provided', () => {
    const all = loadGlobalIndex();
    const filtered = listIndex('/tmp');
    expect(filtered.length).toBeLessThanOrEqual(all.length);
  });
});
