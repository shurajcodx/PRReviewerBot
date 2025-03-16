/**
 * Severity level of a code issue
 */
export enum IssueSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Type of code issue
 */
export enum IssueType {
  SECURITY = 'security',
  STYLE = 'style',
  BUG = 'bug',
  OPTIMIZATION = 'optimization',
  OTHER = 'other',
}

/**
 * Location of a code issue in a file
 */
export interface IssueLocation {
  filePath: string;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
}

/**
 * Represents a code issue found during analysis
 */
export interface CodeIssue {
  /**
   * Unique identifier for the issue
   */
  id: string;

  /**
   * Title of the issue
   */
  title: string;

  /**
   * Detailed description of the issue
   */
  description: string;

  /**
   * Severity level of the issue
   */
  severity: IssueSeverity;

  /**
   * Type of the issue
   */
  type: IssueType;

  /**
   * Location of the issue in the code
   */
  location: IssueLocation;

  /**
   * Suggested fix for the issue
   */
  suggestedFix?: string;

  /**
   * Agent that found the issue
   */
  agent: string;

  /**
   * Additional metadata about the issue
   */
  metadata?: Record<string, any>;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  branch: string;
  head: {
    sha: string;
    ref: string;
  };
  files: FileChange[];
}

export interface FileChange {
  filename: string;
  status: string;
  patch?: string;
  content: string;
}

export interface GitProvider {
  getPullRequest(repoUrl: string, branch: string): Promise<PullRequest>;
  createReviewComment(
    repoUrl: string,
    prId: string,
    comment: string,
    file: string,
    line: number,
  ): Promise<void>;
}
