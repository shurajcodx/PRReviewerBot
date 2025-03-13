import { CodeIssue } from './types';
export interface Agent {
    name: string;
    analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]>;
}
export * from './ai-agent';
export * from './style-agent';
export * from './types';
export * from "./services";
export * from "./providers";
//# sourceMappingURL=index.d.ts.map