import { mkdirSync, writeFileSync, renameSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

export function handoffId(slug: string) {
  const d = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
  const clean = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase().replace(/-+/g, '-').slice(0, 40).replace(/^-+|-+$/g, '') || 'handoff';
  return `${d}__${clean}`;
}

export function atomicWrite(path: string, data: string) {
  const abs = resolve(path);
  const dir = dirname(abs);
  mkdirSync(dir, { recursive: true });
  const tmp = abs + '.tmp';
  writeFileSync(tmp, data, 'utf8');
  renameSync(tmp, abs);
}

export function readState(idOrPath: string) {
  const p = existsSync(idOrPath) ? idOrPath : join('.continuity', idOrPath, 'state.json');
  if (!existsSync(p)) throw new Error(`handoff not found: ${idOrPath} (tried ${p})`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function repoHash(root: string) {
  return createHash('sha256').update(resolve(root)).digest('hex').slice(0, 12);
}

export function ensureDir(p: string) {
  mkdirSync(resolve(p), { recursive: true });
}
