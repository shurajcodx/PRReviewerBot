import { Agent } from '.';
import { CodeIssue } from './types';
export declare class StyleAgent implements Agent {
    name: string;
    analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]>;
    private mapEslintSeverity;
}
//# sourceMappingURL=style-agent.d.ts.map