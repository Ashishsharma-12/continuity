export declare function getGitSnapshot(cwd: string): {
    stat: string;
    changedFiles: string[];
    untracked: string[];
    branch: string;
    commit: string;
    not_a_repo: false;
    cwd?: undefined;
} | {
    stat: string;
    changedFiles: string[];
    untracked: string[];
    branch: string;
    commit: string;
    not_a_repo: true;
    cwd: string;
};
export declare function getDrift(state: any, cwd: string): {
    branchMismatch: boolean;
    commitMismatch: boolean;
    changedDelta: any;
    not_a_repo: boolean;
};
export declare function writePatch(cwd: string, out: string): string;
