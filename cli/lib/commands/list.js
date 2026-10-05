import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadGlobalIndex } from '../lib/index.js';
export async function listCommand(opts = {}) {
    const cwd = opts.cwd || process.cwd();
    const idx = loadGlobalIndex();
    let filtered = idx;
    if (opts.repo) {
        filtered = idx.filter((x) => resolve(x.repoPath) === resolve(cwd));
    }
    // orphan scan
    const local = join(cwd, '.continuity');
    let orphans = [];
    if (existsSync(local)) {
        const dirs = readdirSync(local, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
        const ids = new Set(idx.map((x) => x.id));
        orphans = dirs.filter(d => !ids.has(d));
    }
    const all = [...filtered];
    for (const o of orphans) {
        all.push({ id: o, repoPath: cwd, branch: 'orphan', commit: '', createdAt: '', harness: 'orphan', goalHash: o, statePath: `.continuity/${o}/state.json` });
    }
    if (opts.json) {
        console.log(JSON.stringify(all, null, 2));
        return all;
    }
    if (!all.length) {
        console.log('no handoffs');
        return all;
    }
    console.log('id | repo | branch | commit | goal | harness');
    for (const e of all.slice(-10)) {
        console.log(`${e.id} | ${e.repoPath} | ${e.branch} | ${e.commit?.slice(0, 7) || ''} | ${(e.goalHash || '').slice(0, 40)} | ${e.harness}`);
    }
    if (orphans.length)
        console.log(`\norphans: ${orphans.join(', ')}`);
    return all;
}
