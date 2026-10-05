export declare function createCommand(goal: string, opts?: {
    yes?: boolean;
    fullPatch?: boolean;
    cwd?: string;
    auto?: boolean;
    allowSecrets?: boolean;
}): Promise<string>;
