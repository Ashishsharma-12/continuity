import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveHandoff } from '../lib/index.js';
import { getDrift } from '../lib/git.js';
export async function statusCommand(id, opts = {}) {
    const cwd = opts.cwd || process.cwd();
    const targetId = id || 'latest';
    const statePath = resolveHandoff(targetId, cwd);
    const fullPath = statePath.startsWith('/') || statePath.match(/^[A-Z]:/) ? statePath : resolve(join(cwd, statePath));
    if (!existsSync(fullPath))
        throw new Error(`handoff state not found: ${statePath}`);
    const state = JSON.parse(readFileSync(fullPath, 'utf8'));
    const drift = getDrift(state, cwd);
    const result = {
        id: state.handoff.id,
        branch: state.handoff.branch,
        commit: state.handoff.commit,
        drift: drift.branchMismatch || drift.commitMismatch || false,
        branchMismatch: drift.branchMismatch || false,
        commitMismatch: drift.commitMismatch || false,
        changedDelta: drift.changedDelta || [],
        not_a_repo: drift.not_a_repo || false,
    };
    if (opts.fullPatch) {
        try {
            const patchPath = resolve(join(cwd, state.git_snapshot.patchPath));
            result.patch = readFileSync(patchPath, 'utf8');
        }
        catch {
            result.patch = '';
        }
    }
    if (opts.json) {
        console.log(JSON.stringify(result, null, 2));
    }
    else {
        if (drift.not_a_repo)
            console.log('not a git repo — drift check skipped');
        else {
            console.log(`id: ${result.id}`);
            console.log(`expected branch=${state.handoff.branch} commit=${state.handoff.commit}`);
            console.log(`drift: ${result.drift} branchMismatch=${result.branchMismatch} commitMismatch=${result.commitMismatch}`);
            if (result.changedDelta.length)
                console.log(`changedDelta: ${result.changedDelta.join(', ')}`);
        }
    }
    return result;
}
