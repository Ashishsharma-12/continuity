import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { resolveHandoff } from '../lib/index.js';
import { validateState } from '../lib/validate.js';
import { getDrift } from '../lib/git.js';
export async function resumeCommand(id, opts = {}) {
    const cwd = opts.cwd || process.cwd();
    const targetId = id || 'latest';
    const statePath = resolveHandoff(targetId, cwd);
    const fullPath = statePath.startsWith('/') || statePath.match(/^[A-Z]:/) ? statePath : resolve(join(cwd, statePath));
    if (!existsSync(fullPath))
        throw new Error(`handoff state not found: ${statePath}`);
    const state = JSON.parse(readFileSync(fullPath, 'utf8'));
    const v = validateState(state);
    if (!v.ok) {
        throw new Error(`validation failed: ${v.errors.map((e) => e.message).join('; ')}`);
    }
    const drift = getDrift(state, cwd);
    if (!opts.yes && drift.branchMismatch || drift.commitMismatch) {
        console.warn(`drift detected — branchMismatch=${drift.branchMismatch} commitMismatch=${drift.commitMismatch} — continue anyway? (use --yes to force)`);
    }
    if (opts.json) {
        console.log(JSON.stringify(state, null, 2));
        return state;
    }
    const stateDir = join(fullPath, '..');
    const mdPath = join(stateDir, 'STATE.md');
    let md = '';
    try {
        md = readFileSync(mdPath, 'utf8');
    }
    catch {
        md = JSON.stringify(state, null, 2);
    }
    console.log(md);
    console.log(`\n---\nNEXT: ${state.next_action}\n`);
    console.log(`Read order: ${state.context_notes.readOrder || `Read .continuity/${state.handoff.id}/STATE.md then git diff --stat`}`);
    if (drift.not_a_repo) {
        console.log('Note: not a git repo — drift check skipped');
    }
    else if (drift.branchMismatch || drift.commitMismatch) {
        console.log(`Drift: branch ${state.handoff.branch}→${drift ? 'current' : ''} commit ${state.handoff.commit}→current (warn-not-block)`);
    }
    return state;
}
