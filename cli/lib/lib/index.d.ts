export declare function globalIndexPath(): string;
export declare function loadGlobalIndex(): any[];
export declare function appendIndex(entry: any): Promise<void>;
export declare function resolveHandoff(id: string, cwd: string): any;
export declare function listIndex(cwd?: string): any[];
export declare function listOrphans(cwd: string): string[];
