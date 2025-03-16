import { CodeIssue, IssueType, IssueSeverity, IssueLocation } from '@pr-reviewer-bot/core';
import path from 'path';

/**
 * Base class for all review agents
 */
export abstract class BaseAgent {
  /**
   * Name of the agent
   */
  abstract get name(): string;

  /**
   * Analyze a file for issues
   * @param filePath Path to the file
   * @param content Content of the file
   * @param repoDir Repository directory
   * @returns Array of code issues
   */
  abstract analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]>;

  /**
   * Generate a unique ID for an issue
   * @param type Issue type
   * @param filePath File path
   * @param line Line number
   * @returns Unique ID
   */
  protected generateIssueId(type: string, filePath: string, line?: number): string {
    const fileName = path.basename(filePath);
    const lineStr = line ? `-L${line}` : '';
    return `${this.name}-${type}-${fileName}${lineStr}-${Date.now().toString(36)}`;
  }

  /**
   * Create a code issue
   * @param title Issue title
   * @param description Issue description
   * @param type Issue type
   * @param severity Issue severity
   * @param filePath File path
   * @param startLine Start line
   * @param endLine End line
   * @param suggestedFix Suggested fix
   * @returns Code issue
   */
  protected createIssue(
    title: string,
    description: string,
    type: IssueType,
    severity: IssueSeverity,
    filePath: string,
    startLine?: number,
    endLine?: number,
    suggestedFix?: string,
  ): CodeIssue {
    const location: IssueLocation = {
      filePath,
      startLine,
      endLine,
    };

    return {
      id: this.generateIssueId(type.toString(), filePath, startLine),
      title,
      description,
      severity,
      type,
      location,
      suggestedFix,
      agent: this.name,
    };
  }

  /**
   * Extract the relative path from the absolute path
   * @param filePath Absolute file path
   * @param repoDir Repository directory
   * @returns Relative file path
   */
  protected getRelativePath(filePath: string, repoDir: string): string {
    return path.relative(repoDir, filePath);
  }
}
