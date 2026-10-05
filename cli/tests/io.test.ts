import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handoffId, atomicWrite, repoHash } from '../src/lib/io.js';

describe('io', () => {
  it('handoffId matches pattern', () => {
    const id = handoffId('add-oauth-feature');
    expect(id).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}__[a-z0-9-]+$/);
  });

  it('handoffId sanitizes slug', () => {
    const id = handoffId('Add OAuth!!! Feature 123');
    expect(id).toMatch(/__add-oauth-feature-123$/);
  });

  it('atomicWrite writes and is readable', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-io-'));
    const p = join(dir, 'sub', 'file.txt');
    atomicWrite(p, 'hello');
    expect(existsSync(p)).toBe(true);
    expect(readFileSync(p, 'utf8')).toBe('hello');
    atomicWrite(p, 'world');
    expect(readFileSync(p, 'utf8')).toBe('world');
    rmSync(dir, { recursive: true, force: true });
  });

  it('repoHash stable and 12 chars', () => {
    const h1 = repoHash('/tmp/foo');
    const h2 = repoHash('/tmp/foo');
    expect(h1).toBe(h2);
    expect(h1.length).toBe(12);
    expect(repoHash('/tmp/bar')).not.toBe(h1);
  });
});
