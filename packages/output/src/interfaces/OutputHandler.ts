import { CodeIssue } from '@pr-reviewer-bot/agents';

/**
 * Interface for output handlers
 */
export interface OutputHandler {
  /**
   * Handle the output of code issues
   * @param issues Array of code issues
   * @returns Promise that resolves when the output is handled
   */
  handleOutput(issues: CodeIssue[]): Promise<void>;
}

/**
 * Options for output handlers
 */
export interface OutputHandlerOptions {
  /**
   * File path for file output
   */
  filePath?: string;

  /**
   * Git repository URL
   */
  repoUrl?: string;

  /**
   * Git access token
   */
  gitToken?: string;

  /**
   * Pull request number
   */
  prNumber?: number;

  /**
   * Group issues by file
   */
  groupByFile?: boolean;

  /**
   * Group issues by type
   */
  groupByType?: boolean;

  /**
   * Group issues by severity
   */
  groupBySeverity?: boolean;
}
