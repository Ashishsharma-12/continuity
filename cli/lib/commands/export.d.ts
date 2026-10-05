export declare function exportCommand(id: string, opts?: {
    zip?: boolean;
    stdout?: boolean;
    gist?: boolean;
    cwd?: string;
}): Promise<void>;
