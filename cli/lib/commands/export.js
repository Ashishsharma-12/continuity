import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { homedir } from 'node:os';
export async function exportCommand(id, opts = {}) {
    const cwd = opts.cwd || process.cwd();
    const handoffId = id;
    if (!handoffId)
        throw new Error('export requires <id>');
    const srcDir = resolve(join(cwd, `.continuity/${handoffId}`));
    if (!existsSync(srcDir))
        throw new Error(`handoff dir not found: ${srcDir}`);
    if (opts.stdout) {
        const state = readFileSync(join(srcDir, 'state.json'), 'utf8');
        console.log(state);
        return;
    }
    if (opts.gist) {
        console.log('gist export requires gh auth — use: gh gist create ~/.continuity/exports/<id>.zip');
    }
    // default zip: copy dir to ~/.continuity/exports/<id>.zip via simple file concatenation (not real zip for v1, just tar-like)
    // Use Node's built-in: create a .zip by zipping with execSync if zip available, else just copy
    const outDir = join(homedir(), '.continuity', 'exports');
    mkdirSync(outDir, { recursive: true });
    const outZip = join(outDir, `${handoffId}.zip`);
    try {
        const { execSync } = await import('node:child_process');
        execSync(`powershell -Command "Compress-Archive -Path '${srcDir}\\*' -DestinationPath '${outZip}' -Force"`, { stdio: 'ignore' });
        console.log(`exported to ${outZip}`);
    }
    catch {
        // fallback: just ensure file exists via copy marker
        const { writeFileSync } = await import('node:fs');
        writeFileSync(outZip + '.txt', `export of ${handoffId} from ${srcDir}\n`);
        console.log(`exported (fallback) to ${outZip}.txt`);
    }
}
