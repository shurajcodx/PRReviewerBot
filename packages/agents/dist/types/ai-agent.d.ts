import { Agent } from './index';
import { CodeIssue } from './types';
export declare class AIAgent implements Agent {
    name: string;
    private openai;
    constructor(apiKey: string);
    analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]>;
    private detectLanguage;
}
//# sourceMappingURL=ai-agent.d.ts.map