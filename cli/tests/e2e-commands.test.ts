import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

function binPath() {
  return resolve(join(process.cwd(), 'lib/bin.js'));
}

describe('commands', () => {
  it('create → list → resume → validate round-trip', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-'));
    execSync('git init -q', { cwd: dir });
    execSync('git config user.email a@a', { cwd: dir });
    execSync('git config user.name a', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi');
    execSync('git add . && git commit -qm init', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi2');
    const bin = binPath();
    execSync(`node ${bin} create "add feature" --yes`, { cwd: dir });
    const list = execSync(`node ${bin} list --json`, { cwd: dir }).toString();
    expect(list).toContain('add feature');
    const resume = execSync(`node ${bin} resume latest`, { cwd: dir }).toString();
    expect(resume).toContain('NEXT:');
    execSync(`node ${bin} validate latest`, { cwd: dir });
    rmSync(dir, { recursive: true, force: true });
  });

  it('status reports drift after branch switch', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-drift-'));
    execSync('git init -q', { cwd: dir });
    execSync('git config user.email a@a', { cwd: dir });
    execSync('git config user.name a', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi');
    execSync('git add . && git commit -qm init', { cwd: dir });
    const bin = binPath();
    execSync(`node ${bin} create "drift test" --yes`, { cwd: dir });
    execSync('git checkout -b drift -q', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'change');
    const out = execSync(`node ${bin} status latest --json`, { cwd: dir }).toString();
    const j = JSON.parse(out);
    expect(j.drift).toBe(true);
    rmSync(dir, { recursive: true, force: true });
  });

  it('fallback handoff validates after validate --fix', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cont-fallback-'));
    execSync('git init -q', { cwd: dir });
    execSync('git config user.email a@a', { cwd: dir });
    execSync('git config user.name a', { cwd: dir });
    writeFileSync(join(dir, 'a.txt'), 'hi');
    execSync('git add . && git commit -qm init', { cwd: dir });
    const bin = binPath();
    execSync(`node ${bin} create "fallback test" --yes`, { cwd: dir });
    // simulate fallback: manually corrupt state.json next_action to vague, then fix
    const statePath = execSync(`node ${bin} list --json`, { cwd: dir }).toString();
    const list = JSON.parse(statePath);
    const last = list[list.length - 1];
    const stateFile = join(dir, last.statePath);
    const state = JSON.parse(readFileSync(stateFile, 'utf8'));
    state.next_action = 'continue work';
    writeFileSync(stateFile, JSON.stringify(state, null, 2));
    // validate should fail
    try { execSync(`node ${bin} validate latest`, { cwd: dir }); throw new Error('should have failed'); } catch (e: any) { expect(e.status).toBe(2); }
    // fix
    execSync(`node ${bin} validate latest --fix`, { cwd: dir });
    execSync(`node ${bin} validate latest`, { cwd: dir });
    rmSync(dir, { recursive: true, force: true });
  }, 15000);
});
