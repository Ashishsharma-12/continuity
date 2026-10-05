import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

export function getGitSnapshot(cwd: string) {
  try {
    const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim();
    const commit = execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim();
    let stat = '';
    let changedFiles: string[] = [];
    let untracked: string[] = [];
    try { stat = execSync('git diff --stat', { cwd, encoding: 'utf8' }); } catch { stat = ''; }
    try { changedFiles = execSync('git diff --name-only', { cwd, encoding: 'utf8' }).split('\n').filter(Boolean); } catch { changedFiles = []; }
    try { untracked = execSync('git ls-files --others --exclude-standard', { cwd, encoding: 'utf8' }).split('\n').filter(Boolean); } catch { untracked = []; }
    return { stat, changedFiles, untracked, branch, commit, not_a_repo: false as const };
  } catch {
    return { stat: '', changedFiles: [] as string[], untracked: [] as string[], branch: '', commit: '', not_a_repo: true as const, cwd };
  }
}

export function getDrift(state: any, cwd: string) {
  const s = getGitSnapshot(cwd);
  if ((s as any).not_a_repo) return { branchMismatch: false, commitMismatch: false, changedDelta: [] as string[], not_a_repo: true };
  return {
    branchMismatch: (s as any).branch !== state.handoff.branch,
    commitMismatch: (s as any).commit !== state.handoff.commit,
    changedDelta: (s as any).changedFiles.filter((f: string) => !state.git_snapshot.changedFiles.includes(f)),
    not_a_repo: false,
  };
}

export function writePatch(cwd: string, out: string) {
  try {
    const patch = execSync('git diff', { cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    writeFileSync(out, patch);
    const lines = patch.split('\n').slice(0, 200).join('\n');
    return lines;
  } catch {
    try { writeFileSync(out, ''); } catch {}
    return '';
  }
}
