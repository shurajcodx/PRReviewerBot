import { CodeIssue } from './types';

export interface Agent {
  name: string;
  analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]>;
}

export * from './BaseAgent';
export * from './AIAgent';
export * from './StyleAgent';
export * from './SecurityAgent';
export * from './BugDetectionAgent';
export * from './OptimizationAgent';

export * from './types';
