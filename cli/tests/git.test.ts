import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { getGitSnapshot, getDrift, writePatch } from '../src/lib/git.js';

describe('git', () => {
  it('returns not_a_repo for non-git dir', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-git-'));
    const s = getGitSnapshot(dir);
    expect((s as any).not_a_repo).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns branch/commit for git repo', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-git2-'));
    execSync('git init -q', { cwd: dir });
    execSync('git config user.email a@a', { cwd: dir });
    execSync('git config user.name a', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi');
    execSync('git add . && git commit -qm init', { cwd: dir });
    const s = getGitSnapshot(dir) as any;
    expect(s.not_a_repo).toBe(false);
    expect(s.branch.length).toBeGreaterThan(0);
    expect(s.commit.length).toBeGreaterThan(6);
    rmSync(dir, { recursive: true, force: true });
  });

  it('getDrift detects branch/commit mismatch', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-git3-'));
    execSync('git init -q', { cwd: dir });
    execSync('git config user.email a@a', { cwd: dir });
    execSync('git config user.name a', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi');
    execSync('git add . && git commit -qm init', { cwd: dir });
    const state = {
      handoff: { branch: 'other-branch', commit: 'deadbeef' },
      git_snapshot: { changedFiles: [] },
    };
    const d = getDrift(state, dir);
    expect(d.branchMismatch).toBe(true);
    expect(d.commitMismatch).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it('writePatch writes file and returns truncated preview', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-git4-'));
    execSync('git init -q', { cwd: dir });
    execSync('git config user.email a@a', { cwd: dir });
    execSync('git config user.name a', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi');
    execSync('git add . && git commit -qm init', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi2');
    const out = join(dir, 'patch.txt');
    const preview = writePatch(dir, out);
    expect(preview).toBeDefined();
    rmSync(dir, { recursive: true, force: true });
  });
});
