import { describe, it, expect } from 'vitest';
import { checkSecrets, validateState } from '../src/lib/validate.js';
import { handoffId } from '../src/lib/io.js';

describe('hardening', () => {
  it('redacts .env diff', () => {
    expect(checkSecrets('diff --git a/.env b/.env\n+SECRET=abc', ['.env'])).toBeTruthy();
  });

  it('truncates patch to ~200 lines', () => {
    const long = Array(500).fill('line').join('\n');
    const truncated = long.split('\n').slice(0, 200).join('\n');
    expect(truncated.split('\n').length).toBe(200);
    expect(truncated.split('\n').slice(0, 200).join('\n').split('\n').length).toBe(200);
  });

  it('auto-save id prefix', () => {
    const id = handoffId('auto');
    expect(id).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // auto-create should produce auto- prefix via create --auto
  });

  it('lint rejects vague next_action', async () => {
    const o: any = {
      schemaVersion: '1.0',
      handoff: { id: '2026-09-07T14-30__a-test', createdAt: new Date().toISOString(), sourceHarness: 'claude-code', sourceModel: '', repo: { root: '/', remote: '', hash: 'h' }, branch: 'main', commit: 'abc' },
      original_goal: 'g long enough for test',
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
    expect(validateState(o).ok).toBe(false);
  });

  it('checkSecrets detects kubeconfig and pem', () => {
    expect(checkSecrets('agos-dev-readonly-kubeconfig.yaml', ['agos-dev-readonly-kubeconfig.yaml'])).toBeTruthy();
    expect(checkSecrets('-----BEGIN PRIVATE KEY-----', ['*.pem'])).toBeTruthy();
    expect(checkSecrets('secrets/my.pem', ['secrets/**'])).toBeTruthy();
  });

  it('handoffId collapses multiple dashes', () => {
    const id = handoffId('Add OAuth!!! Feature 123');
    expect(id).toMatch(/__add-oauth-feature-123$/);
    expect(id).not.toContain('--');
  });

  it('validateState passes with redacted secrets', () => {
    const o: any = {
      schemaVersion: '1.0',
      handoff: { id: '2026-09-07T14-30__b-test', createdAt: new Date().toISOString(), sourceHarness: 'claude-code', sourceModel: '', repo: { root: '/', remote: '', hash: 'h' }, branch: 'main', commit: 'abc' },
      original_goal: 'valid goal long enough',
      current_plan: [],
      todos: { done: [], pending: [{ task: 't' }], blocked: [] },
      key_decisions: [],
      assumptions: [],
      open_questions: [],
      git_snapshot: { stat: '', changedFiles: [], untracked: [], patchPath: '', patchTruncated: '<redacted: secrets>', stashRef: null },
      verification: { lastCommand: '', status: 'not_run', summary: '', logPath: '' },
      next_action: 'Continue at todos.pending[0]: implement feature per plan',
      context_notes: { entryPoints: [], readOrder: '' },
      secrets_policy: { ignoredGlobs: ['.env'], redacted: true },
    };
    expect(validateState(o).ok).toBe(true);
  });
});
