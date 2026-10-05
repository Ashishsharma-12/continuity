import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export const HandoffSchema = z.object({
  id: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}__[a-z0-9-]+$/),
  createdAt: z.string().datetime(),
  sourceHarness: z.enum(['claude-code','codex','cursor','opencode','windsurf','cline','roo','auto-save','unknown']),
  sourceModel: z.string(),
  repo: z.object({ root: z.string(), remote: z.string(), hash: z.string() }),
  branch: z.string(),
  commit: z.string(),
});

export const StateSchema = z.object({
  schemaVersion: z.literal('1.0'),
  handoff: HandoffSchema,
  original_goal: z.string().min(10),
  current_plan: z.array(z.string()),
  todos: z.object({
    done: z.array(z.object({ task: z.string(), refs: z.array(z.string()).optional(), commit: z.string().optional() })),
    pending: z.array(z.object({ task: z.string(), refs: z.array(z.string()).optional(), blocked: z.boolean().optional() })),
    blocked: z.array(z.object({ task: z.string(), reason: z.string() })),
  }),
  key_decisions: z.array(z.object({ decision: z.string(), why: z.string(), rejected: z.array(z.string()) })),
  assumptions: z.array(z.string()),
  open_questions: z.array(z.string()),
  git_snapshot: z.object({
    stat: z.string(),
    changedFiles: z.array(z.string()),
    untracked: z.array(z.string()),
    patchPath: z.string(),
    patchTruncated: z.string(),
    stashRef: z.string().nullable(),
    not_a_repo: z.boolean().optional(),
    cwd: z.string().optional(),
  }),
  verification: z.object({
    lastCommand: z.string(),
    status: z.enum(['pass','fail','not_run']),
    summary: z.string(),
    logPath: z.string(),
  }),
  next_action: z.string().min(12).refine(s => !/^(continue work|do next step|fix remaining)$/i.test(s.trim()), { message: 'next_action too vague' }),
  context_notes: z.object({ entryPoints: z.array(z.string()), readOrder: z.string() }),
  secrets_policy: z.object({ ignoredGlobs: z.array(z.string()), redacted: z.boolean() }),
}).passthrough();

export const stateJsonSchema = zodToJsonSchema(StateSchema, { target: 'jsonSchema7' });
export type State = z.infer<typeof StateSchema>;
