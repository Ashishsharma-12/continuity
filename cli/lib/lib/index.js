import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import lockfile from 'proper-lockfile';
export function globalIndexPath() {
    return join(homedir(), '.continuity', 'index.json');
}
export function loadGlobalIndex() {
    const p = globalIndexPath();
    try {
        return JSON.parse(readFileSync(p, 'utf8'));
    }
    catch {
        return [];
    }
}
export async function appendIndex(entry) {
    const p = globalIndexPath();
    mkdirSync(join(homedir(), '.continuity'), { recursive: true });
    if (!existsSync(p))
        writeFileSync(p, '[]', 'utf8');
    let release = null;
    try {
        release = await lockfile.lock(p, { retries: { retries: 5, minTimeout: 50 } });
    }
    catch {
        // fallback: no lock available (e.g., file not correctly closed), just write
    }
    try {
        const arr = loadGlobalIndex();
        arr.push(entry);
        writeFileSync(p, JSON.stringify(arr, null, 2), 'utf8');
    }
    finally {
        if (release)
            await release();
    }
}
export function resolveHandoff(id, cwd) {
    const idx = loadGlobalIndex();
    if (id === 'latest') {
        const filtered = idx.filter((x) => resolve(x.repoPath) === resolve(cwd));
        const pool = filtered.length ? filtered : idx;
        if (!pool.length) {
            // fallback to local .continuity scanning
            const local = join(cwd, '.continuity');
            if (existsSync(local)) {
                const dirs = readdirSync(local, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort();
                if (dirs.length)
                    return join(cwd, '.continuity', dirs[dirs.length - 1], 'state.json');
            }
            throw new Error('no handoff found for latest');
        }
        const sorted = [...pool].sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
        return sorted[sorted.length - 1].statePath && !sorted[sorted.length - 1].statePath.startsWith('/')
            ? join(cwd, sorted[sorted.length - 1].statePath)
            : sorted[sorted.length - 1].statePath || join(cwd, '.continuity', sorted[sorted.length - 1].id, 'state.json');
    }
    const hit = idx.find((x) => x.id === id);
    if (hit) {
        const statePath = hit.statePath;
        if (existsSync(statePath))
            return statePath;
        if (existsSync(join(cwd, statePath)))
            return join(cwd, statePath);
        return statePath;
    }
    const direct = join(cwd, '.continuity', id, 'state.json');
    if (existsSync(direct))
        return direct;
    if (existsSync(id))
        return id;
    throw new Error(`handoff not found: ${id}`);
}
export function listIndex(cwd) {
    const idx = loadGlobalIndex();
    if (cwd)
        return idx.filter((x) => resolve(x.repoPath) === resolve(cwd));
    return idx;
}
export function listOrphans(cwd) {
    const local = join(cwd, '.continuity');
    if (!existsSync(local))
        return [];
    const dirs = readdirSync(local, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
    const idx = new Set(loadGlobalIndex().map((x) => x.id));
    return dirs.filter(d => !idx.has(d));
}
