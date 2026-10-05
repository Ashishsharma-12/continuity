import { z } from 'zod';
export declare const HandoffSchema: z.ZodObject<{
    id: z.ZodString;
    createdAt: z.ZodString;
    sourceHarness: z.ZodEnum<["claude-code", "codex", "cursor", "opencode", "windsurf", "cline", "roo", "auto-save", "unknown"]>;
    sourceModel: z.ZodString;
    repo: z.ZodObject<{
        root: z.ZodString;
        remote: z.ZodString;
        hash: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        root: string;
        remote: string;
        hash: string;
    }, {
        root: string;
        remote: string;
        hash: string;
    }>;
    branch: z.ZodString;
    commit: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
    sourceModel: string;
    repo: {
        root: string;
        remote: string;
        hash: string;
    };
    branch: string;
    commit: string;
}, {
    id: string;
    createdAt: string;
    sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
    sourceModel: string;
    repo: {
        root: string;
        remote: string;
        hash: string;
    };
    branch: string;
    commit: string;
}>;
export declare const StateSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<"1.0">;
    handoff: z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        sourceHarness: z.ZodEnum<["claude-code", "codex", "cursor", "opencode", "windsurf", "cline", "roo", "auto-save", "unknown"]>;
        sourceModel: z.ZodString;
        repo: z.ZodObject<{
            root: z.ZodString;
            remote: z.ZodString;
            hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            root: string;
            remote: string;
            hash: string;
        }, {
            root: string;
            remote: string;
            hash: string;
        }>;
        branch: z.ZodString;
        commit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
        sourceModel: string;
        repo: {
            root: string;
            remote: string;
            hash: string;
        };
        branch: string;
        commit: string;
    }, {
        id: string;
        createdAt: string;
        sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
        sourceModel: string;
        repo: {
            root: string;
            remote: string;
            hash: string;
        };
        branch: string;
        commit: string;
    }>;
    original_goal: z.ZodString;
    current_plan: z.ZodArray<z.ZodString, "many">;
    todos: z.ZodObject<{
        done: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            refs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            commit: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }, {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }>, "many">;
        pending: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            refs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            blocked: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }, {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }>, "many">;
        blocked: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            task: string;
            reason: string;
        }, {
            task: string;
            reason: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        done: {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }[];
        pending: {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }[];
        blocked: {
            task: string;
            reason: string;
        }[];
    }, {
        done: {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }[];
        pending: {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }[];
        blocked: {
            task: string;
            reason: string;
        }[];
    }>;
    key_decisions: z.ZodArray<z.ZodObject<{
        decision: z.ZodString;
        why: z.ZodString;
        rejected: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        decision: string;
        why: string;
        rejected: string[];
    }, {
        decision: string;
        why: string;
        rejected: string[];
    }>, "many">;
    assumptions: z.ZodArray<z.ZodString, "many">;
    open_questions: z.ZodArray<z.ZodString, "many">;
    git_snapshot: z.ZodObject<{
        stat: z.ZodString;
        changedFiles: z.ZodArray<z.ZodString, "many">;
        untracked: z.ZodArray<z.ZodString, "many">;
        patchPath: z.ZodString;
        patchTruncated: z.ZodString;
        stashRef: z.ZodNullable<z.ZodString>;
        not_a_repo: z.ZodOptional<z.ZodBoolean>;
        cwd: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        stat: string;
        changedFiles: string[];
        untracked: string[];
        patchPath: string;
        patchTruncated: string;
        stashRef: string | null;
        not_a_repo?: boolean | undefined;
        cwd?: string | undefined;
    }, {
        stat: string;
        changedFiles: string[];
        untracked: string[];
        patchPath: string;
        patchTruncated: string;
        stashRef: string | null;
        not_a_repo?: boolean | undefined;
        cwd?: string | undefined;
    }>;
    verification: z.ZodObject<{
        lastCommand: z.ZodString;
        status: z.ZodEnum<["pass", "fail", "not_run"]>;
        summary: z.ZodString;
        logPath: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "pass" | "fail" | "not_run";
        lastCommand: string;
        summary: string;
        logPath: string;
    }, {
        status: "pass" | "fail" | "not_run";
        lastCommand: string;
        summary: string;
        logPath: string;
    }>;
    next_action: z.ZodEffects<z.ZodString, string, string>;
    context_notes: z.ZodObject<{
        entryPoints: z.ZodArray<z.ZodString, "many">;
        readOrder: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entryPoints: string[];
        readOrder: string;
    }, {
        entryPoints: string[];
        readOrder: string;
    }>;
    secrets_policy: z.ZodObject<{
        ignoredGlobs: z.ZodArray<z.ZodString, "many">;
        redacted: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        ignoredGlobs: string[];
        redacted: boolean;
    }, {
        ignoredGlobs: string[];
        redacted: boolean;
    }>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    schemaVersion: z.ZodLiteral<"1.0">;
    handoff: z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        sourceHarness: z.ZodEnum<["claude-code", "codex", "cursor", "opencode", "windsurf", "cline", "roo", "auto-save", "unknown"]>;
        sourceModel: z.ZodString;
        repo: z.ZodObject<{
            root: z.ZodString;
            remote: z.ZodString;
            hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            root: string;
            remote: string;
            hash: string;
        }, {
            root: string;
            remote: string;
            hash: string;
        }>;
        branch: z.ZodString;
        commit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
        sourceModel: string;
        repo: {
            root: string;
            remote: string;
            hash: string;
        };
        branch: string;
        commit: string;
    }, {
        id: string;
        createdAt: string;
        sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
        sourceModel: string;
        repo: {
            root: string;
            remote: string;
            hash: string;
        };
        branch: string;
        commit: string;
    }>;
    original_goal: z.ZodString;
    current_plan: z.ZodArray<z.ZodString, "many">;
    todos: z.ZodObject<{
        done: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            refs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            commit: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }, {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }>, "many">;
        pending: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            refs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            blocked: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }, {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }>, "many">;
        blocked: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            task: string;
            reason: string;
        }, {
            task: string;
            reason: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        done: {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }[];
        pending: {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }[];
        blocked: {
            task: string;
            reason: string;
        }[];
    }, {
        done: {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }[];
        pending: {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }[];
        blocked: {
            task: string;
            reason: string;
        }[];
    }>;
    key_decisions: z.ZodArray<z.ZodObject<{
        decision: z.ZodString;
        why: z.ZodString;
        rejected: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        decision: string;
        why: string;
        rejected: string[];
    }, {
        decision: string;
        why: string;
        rejected: string[];
    }>, "many">;
    assumptions: z.ZodArray<z.ZodString, "many">;
    open_questions: z.ZodArray<z.ZodString, "many">;
    git_snapshot: z.ZodObject<{
        stat: z.ZodString;
        changedFiles: z.ZodArray<z.ZodString, "many">;
        untracked: z.ZodArray<z.ZodString, "many">;
        patchPath: z.ZodString;
        patchTruncated: z.ZodString;
        stashRef: z.ZodNullable<z.ZodString>;
        not_a_repo: z.ZodOptional<z.ZodBoolean>;
        cwd: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        stat: string;
        changedFiles: string[];
        untracked: string[];
        patchPath: string;
        patchTruncated: string;
        stashRef: string | null;
        not_a_repo?: boolean | undefined;
        cwd?: string | undefined;
    }, {
        stat: string;
        changedFiles: string[];
        untracked: string[];
        patchPath: string;
        patchTruncated: string;
        stashRef: string | null;
        not_a_repo?: boolean | undefined;
        cwd?: string | undefined;
    }>;
    verification: z.ZodObject<{
        lastCommand: z.ZodString;
        status: z.ZodEnum<["pass", "fail", "not_run"]>;
        summary: z.ZodString;
        logPath: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "pass" | "fail" | "not_run";
        lastCommand: string;
        summary: string;
        logPath: string;
    }, {
        status: "pass" | "fail" | "not_run";
        lastCommand: string;
        summary: string;
        logPath: string;
    }>;
    next_action: z.ZodEffects<z.ZodString, string, string>;
    context_notes: z.ZodObject<{
        entryPoints: z.ZodArray<z.ZodString, "many">;
        readOrder: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entryPoints: string[];
        readOrder: string;
    }, {
        entryPoints: string[];
        readOrder: string;
    }>;
    secrets_policy: z.ZodObject<{
        ignoredGlobs: z.ZodArray<z.ZodString, "many">;
        redacted: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        ignoredGlobs: string[];
        redacted: boolean;
    }, {
        ignoredGlobs: string[];
        redacted: boolean;
    }>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    schemaVersion: z.ZodLiteral<"1.0">;
    handoff: z.ZodObject<{
        id: z.ZodString;
        createdAt: z.ZodString;
        sourceHarness: z.ZodEnum<["claude-code", "codex", "cursor", "opencode", "windsurf", "cline", "roo", "auto-save", "unknown"]>;
        sourceModel: z.ZodString;
        repo: z.ZodObject<{
            root: z.ZodString;
            remote: z.ZodString;
            hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            root: string;
            remote: string;
            hash: string;
        }, {
            root: string;
            remote: string;
            hash: string;
        }>;
        branch: z.ZodString;
        commit: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: string;
        sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
        sourceModel: string;
        repo: {
            root: string;
            remote: string;
            hash: string;
        };
        branch: string;
        commit: string;
    }, {
        id: string;
        createdAt: string;
        sourceHarness: "unknown" | "claude-code" | "codex" | "cursor" | "opencode" | "windsurf" | "cline" | "roo" | "auto-save";
        sourceModel: string;
        repo: {
            root: string;
            remote: string;
            hash: string;
        };
        branch: string;
        commit: string;
    }>;
    original_goal: z.ZodString;
    current_plan: z.ZodArray<z.ZodString, "many">;
    todos: z.ZodObject<{
        done: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            refs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            commit: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }, {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }>, "many">;
        pending: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            refs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            blocked: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }, {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }>, "many">;
        blocked: z.ZodArray<z.ZodObject<{
            task: z.ZodString;
            reason: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            task: string;
            reason: string;
        }, {
            task: string;
            reason: string;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        done: {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }[];
        pending: {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }[];
        blocked: {
            task: string;
            reason: string;
        }[];
    }, {
        done: {
            task: string;
            commit?: string | undefined;
            refs?: string[] | undefined;
        }[];
        pending: {
            task: string;
            refs?: string[] | undefined;
            blocked?: boolean | undefined;
        }[];
        blocked: {
            task: string;
            reason: string;
        }[];
    }>;
    key_decisions: z.ZodArray<z.ZodObject<{
        decision: z.ZodString;
        why: z.ZodString;
        rejected: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        decision: string;
        why: string;
        rejected: string[];
    }, {
        decision: string;
        why: string;
        rejected: string[];
    }>, "many">;
    assumptions: z.ZodArray<z.ZodString, "many">;
    open_questions: z.ZodArray<z.ZodString, "many">;
    git_snapshot: z.ZodObject<{
        stat: z.ZodString;
        changedFiles: z.ZodArray<z.ZodString, "many">;
        untracked: z.ZodArray<z.ZodString, "many">;
        patchPath: z.ZodString;
        patchTruncated: z.ZodString;
        stashRef: z.ZodNullable<z.ZodString>;
        not_a_repo: z.ZodOptional<z.ZodBoolean>;
        cwd: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        stat: string;
        changedFiles: string[];
        untracked: string[];
        patchPath: string;
        patchTruncated: string;
        stashRef: string | null;
        not_a_repo?: boolean | undefined;
        cwd?: string | undefined;
    }, {
        stat: string;
        changedFiles: string[];
        untracked: string[];
        patchPath: string;
        patchTruncated: string;
        stashRef: string | null;
        not_a_repo?: boolean | undefined;
        cwd?: string | undefined;
    }>;
    verification: z.ZodObject<{
        lastCommand: z.ZodString;
        status: z.ZodEnum<["pass", "fail", "not_run"]>;
        summary: z.ZodString;
        logPath: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "pass" | "fail" | "not_run";
        lastCommand: string;
        summary: string;
        logPath: string;
    }, {
        status: "pass" | "fail" | "not_run";
        lastCommand: string;
        summary: string;
        logPath: string;
    }>;
    next_action: z.ZodEffects<z.ZodString, string, string>;
    context_notes: z.ZodObject<{
        entryPoints: z.ZodArray<z.ZodString, "many">;
        readOrder: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        entryPoints: string[];
        readOrder: string;
    }, {
        entryPoints: string[];
        readOrder: string;
    }>;
    secrets_policy: z.ZodObject<{
        ignoredGlobs: z.ZodArray<z.ZodString, "many">;
        redacted: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        ignoredGlobs: string[];
        redacted: boolean;
    }, {
        ignoredGlobs: string[];
        redacted: boolean;
    }>;
}, z.ZodTypeAny, "passthrough">>;
export declare const stateJsonSchema: import("zod-to-json-schema").JsonSchema7Type & {
    $schema?: string | undefined;
    definitions?: {
        [key: string]: import("zod-to-json-schema").JsonSchema7Type;
    } | undefined;
};
export type State = z.infer<typeof StateSchema>;
