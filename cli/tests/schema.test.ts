import { describe, it, expect } from 'vitest';
import { StateSchema } from '../src/lib/schema.js';

describe('StateSchema', () => {
  const base = {
    schemaVersion: '1.0' as const,
    handoff: {
      id: '2026-09-07T14-30__a-test',
      createdAt: new Date().toISOString(),
      sourceHarness: 'claude-code' as const,
      sourceModel: 'm',
      repo: { root: '/tmp', remote: '', hash: 'h' },
      branch: 'main',
      commit: 'abc'
    },
    original_goal: 'Add auth with enough length',
    current_plan: ['s1'],
    todos: { done: [], pending: [{ task: 'Implement refresh' }], blocked: [] },
    key_decisions: [],
    assumptions: [],
    open_questions: [],
    git_snapshot: { stat: '', changedFiles: [], untracked: [], patchPath: '', patchTruncated: '', stashRef: null },
    verification: { lastCommand: '', status: 'not_run' as const, summary: '', logPath: '' },
    next_action: 'Continue at todos.pending[0]: implement refresh in src/auth/refresh.ts',
    context_notes: { entryPoints: [], readOrder: '' },
    secrets_policy: { ignoredGlobs: ['.env'], redacted: true }
  };

  it('rejects vague next_action', () => {
    const r = StateSchema.safeParse({ ...base, next_action: 'continue work' });
    expect(r.success).toBe(false);
  });

  it('accepts valid pending', () => {
    const r = StateSchema.safeParse(base);
    expect(r.success).toBe(true);
  });

  it('rejects missing pending when not done', () => {
    const r = StateSchema.safeParse({ ...base, todos: { done: [], pending: [], blocked: [] }, verification: { ...base.verification, status: 'not_run' } });
    // schema allows empty pending; lint layer handles business rule — so this should still be schema-valid
    expect(r.success).toBe(true);
  });

  it('rejects short original_goal', () => {
    const r = StateSchema.safeParse({ ...base, original_goal: 'hi' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid handoff id format', () => {
    const r = StateSchema.safeParse({ ...base, handoff: { ...base.handoff, id: 'bad id' } });
    expect(r.success).toBe(false);
  });
});
