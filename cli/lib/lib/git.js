import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
export function getGitSnapshot(cwd) {
    try {
        const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim();
        const commit = execSync('git rev-parse HEAD', { cwd, encoding: 'utf8' }).trim();
        let stat = '';
        let changedFiles = [];
        let untracked = [];
        try {
            stat = execSync('git diff --stat', { cwd, encoding: 'utf8' });
        }
        catch {
            stat = '';
        }
        try {
            changedFiles = execSync('git diff --name-only', { cwd, encoding: 'utf8' }).split('\n').filter(Boolean);
        }
        catch {
            changedFiles = [];
        }
        try {
            untracked = execSync('git ls-files --others --exclude-standard', { cwd, encoding: 'utf8' }).split('\n').filter(Boolean);
        }
        catch {
            untracked = [];
        }
        return { stat, changedFiles, untracked, branch, commit, not_a_repo: false };
    }
    catch {
        return { stat: '', changedFiles: [], untracked: [], branch: '', commit: '', not_a_repo: true, cwd };
    }
}
export function getDrift(state, cwd) {
    const s = getGitSnapshot(cwd);
    if (s.not_a_repo)
        return { branchMismatch: false, commitMismatch: false, changedDelta: [], not_a_repo: true };
    return {
        branchMismatch: s.branch !== state.handoff.branch,
        commitMismatch: s.commit !== state.handoff.commit,
        changedDelta: s.changedFiles.filter((f) => !state.git_snapshot.changedFiles.includes(f)),
        not_a_repo: false,
    };
}
export function writePatch(cwd, out) {
    try {
        const patch = execSync('git diff', { cwd, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
        writeFileSync(out, patch);
        const lines = patch.split('\n').slice(0, 200).join('\n');
        return lines;
    }
    catch {
        try {
            writeFileSync(out, '');
        }
        catch { }
        return '';
    }
}
