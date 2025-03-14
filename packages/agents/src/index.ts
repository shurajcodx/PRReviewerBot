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

export { CodeIssue, IssueType, IssueSeverity } from '@pr-reviewer-bot/core';

export * from './ai-agent';
export * from './style-agent';
export * from './types';

export * from "./services";
export * from "./providers";

export * from './ai-connector';
export * from '../../ai-connectors';

export { AIConnector } from '@pr-reviewer-bot/ai-connectors';
