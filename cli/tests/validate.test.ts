import { describe, it, expect } from 'vitest';
import { validateState, lintNextAction, checkSecrets } from '../src/lib/validate.js';

describe('validate', () => {
  it('validateState rejects vague next_action', () => {
    const obj = {
      schemaVersion: '1.0',
      handoff: { id: '2026-09-07T14-30__a-test', createdAt: new Date().toISOString(), sourceHarness: 'claude-code', sourceModel: 'm', repo: { root: '/tmp', remote: '', hash: 'h' }, branch: 'main', commit: 'abc' },
      original_goal: 'Add auth with enough length',
      current_plan: [],
      todos: { done: [], pending: [{ task: 't' }], blocked: [] },
      key_decisions: [],
      assumptions: [],
      open_questions: [],
      git_snapshot: { stat: '', changedFiles: [], untracked: [], patchPath: '', patchTruncated: '', stashRef: null },
      verification: { lastCommand: '', status: 'not_run', summary: '', logPath: '' },
      next_action: 'continue work',
      context_notes: { entryPoints: [], readOrder: '' },
      secrets_policy: { ignoredGlobs: ['.env'], redacted: true },
    };
    const r = validateState(obj);
    expect(r.ok).toBe(false);
  });

  it('lintNextAction flags short', () => {
    expect(lintNextAction('hi')).toBeTruthy();
    expect(lintNextAction('Continue at todos.pending[0]: implement refresh')).toBe(null);
  });

  it('checkSecrets detects .env', () => {
    expect(checkSecrets('diff --git a/.env b/.env', ['.env'])).toBeTruthy();
  });

  it('checkSecrets detects kubeconfig', () => {
    expect(checkSecrets('agos-dev-readonly-kubeconfig.yaml', ['agos-dev-readonly-kubeconfig.yaml'])).toBeTruthy();
  });

  it('checkSecrets passes clean diff', () => {
    expect(checkSecrets('diff --git a/src/app.ts b/src/app.ts', ['.env', '*.pem'])).toBe(null);
  });

  it('checkSecrets detects pem', () => {
    expect(checkSecrets('-----BEGIN PRIVATE KEY-----', ['*.pem'])).toBeTruthy();
  });
});
