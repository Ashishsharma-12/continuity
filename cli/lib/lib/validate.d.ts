export declare function validateState(obj: any): {
    ok: boolean;
    errors: any[];
};
export declare function lintNextAction(s: string): string | null;
export declare function checkSecrets(diff: string, globs: string[]): string | null;
export declare function isVagueNextAction(s: string): boolean;
