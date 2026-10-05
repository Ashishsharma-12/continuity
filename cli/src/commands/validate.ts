import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import { resolveHandoff } from '../lib/index.js';
import { validateState, lintNextAction, checkSecrets } from '../lib/validate.js';
import { atomicWrite } from '../lib/io.js';

export async function validateCommand(id: string, opts: { fix?: boolean; cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  const targetId = id || 'latest';
  const statePath = resolveHandoff(targetId, cwd);
  const fullPath = statePath.startsWith('/') || statePath.match(/^[A-Z]:/) ? statePath : resolve(join(cwd, statePath));
  if (!existsSync(fullPath)) throw new Error(`handoff state not found: ${statePath}`);
  let state = JSON.parse(readFileSync(fullPath, 'utf8'));
  const v = validateState(state);
  const nextLint = lintNextAction(state.next_action || '');
  const secrets = checkSecrets(state.git_snapshot?.patchTruncated || '', state.secrets_policy?.ignoredGlobs || []);
  let ok = v.ok && !nextLint && !secrets;
  if (!ok) {
    if (!v.ok) console.error('schema errors:', v.errors.map((e: any) => e.message).join('; '));
    if (nextLint) console.error('next_action lint:', nextLint);
    if (secrets) console.error('secrets_leak:', secrets);
  }
  if (opts.fix) {
    // normalize: trim whitespace, sort todos, ensure redacted if leaked, fix vague next_action
    if (state.next_action) state.next_action = state.next_action.trim();
    if (state.original_goal) state.original_goal = state.original_goal.trim();
    if (nextLint && state.next_action) {
      state.next_action = `Continue at todos.pending[0]: ${state.todos?.pending?.[0]?.task || state.original_goal || 'next step'} — implement and run tests`;
    }
    if (secrets && state.git_snapshot) state.git_snapshot.patchTruncated = '<redacted: secrets>';
    atomicWrite(fullPath, JSON.stringify(state, null, 2));
    console.log(`fixed ${fullPath}`);
    const v2 = validateState(state);
    if (v2.ok && !lintNextAction(state.next_action) && !checkSecrets(state.git_snapshot?.patchTruncated || '', state.secrets_policy?.ignoredGlobs || [])) {
      console.log('validate --fix: PASS');
      return true;
    }
  }
  if (ok) console.log('validate: PASS');
  else {
    console.log('validate: FAIL');
    if (!opts.fix) process.exitCode = 2;
  }
  return ok;
}
