import { readFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
export async function versionCommand() {
    const candidates = [
        resolve(join(dirname(fileURLToPath(import.meta.url)), '../../package.json')),
        resolve('skills/continuity/cli/package.json'),
    ];
    for (const p of candidates) {
        try {
            const v = JSON.parse(readFileSync(p, 'utf8')).version;
            console.log(v);
            return;
        }
        catch { }
    }
    try {
        const v2 = readFileSync(resolve('skills/continuity/VERSION'), 'utf8').trim();
        console.log(v2);
        return;
    }
    catch { }
    console.log('0.1.0');
}
