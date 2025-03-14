import { CodeIssue, IssueType, IssueSeverity } from '@pr-reviewer-bot/agents';
import { OutputHandler, OutputHandlerOptions } from '../interfaces/OutputHandler';
import path from 'path';

/**
 * Base class for output handlers with common functionality
 */
export abstract class BaseOutputHandler implements OutputHandler {
  protected options: OutputHandlerOptions;
  
  /**
   * Create a new base output handler
   * @param options Output handler options
   */
  constructor(options: OutputHandlerOptions) {
    this.options = options;
  }
  
  /**
   * Handle the output of code issues
   * @param issues Array of code issues
   * @returns Promise that resolves when the output is handled
   */
  abstract handleOutput(issues: CodeIssue[]): Promise<void>;
  
  /**
   * Group issues by file
   * @param issues Array of code issues
   * @returns Map of file paths to arrays of code issues
   */
  protected groupIssuesByFile(issues: CodeIssue[]): Map<string, CodeIssue[]> {
    const groupedIssues = new Map<string, CodeIssue[]>();
    
    for (const issue of issues) {
      const filePath = issue.location.filePath;
      
      if (!groupedIssues.has(filePath)) {
        groupedIssues.set(filePath, []);
      }
      
      groupedIssues.get(filePath)!.push(issue);
    }
    
    return groupedIssues;
  }
  
  /**
   * Group issues by type
   * @param issues Array of code issues
   * @returns Map of issue types to arrays of code issues
   */
  protected groupIssuesByType(issues: CodeIssue[]): Map<IssueType, CodeIssue[]> {
    const groupedIssues = new Map<IssueType, CodeIssue[]>();
    
    for (const issue of issues) {
      if (!groupedIssues.has(issue.type)) {
        groupedIssues.set(issue.type, []);
      }
      
      groupedIssues.get(issue.type)!.push(issue);
    }
    
    return groupedIssues;
  }
  
  /**
   * Group issues by severity
   * @param issues Array of code issues
   * @returns Map of issue severities to arrays of code issues
   */
  protected groupIssuesBySeverity(issues: CodeIssue[]): Map<IssueSeverity, CodeIssue[]> {
    const groupedIssues = new Map<IssueSeverity, CodeIssue[]>();
    
    for (const issue of issues) {
      if (!groupedIssues.has(issue.severity)) {
        groupedIssues.set(issue.severity, []);
      }
      
      groupedIssues.get(issue.severity)!.push(issue);
    }
    
    return groupedIssues;
  }
  
  /**
   * Sort issues by severity (critical first, info last)
   * @param issues Array of code issues
   * @returns Sorted array of code issues
   */
  protected sortIssuesBySeverity(issues: CodeIssue[]): CodeIssue[] {
    const severityOrder = {
      [IssueSeverity.CRITICAL]: 0,
      [IssueSeverity.ERROR]: 1,
      [IssueSeverity.WARNING]: 2,
      [IssueSeverity.INFO]: 3
    };
    
    return [...issues].sort((a, b) => {
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
  
  /**
   * Get a relative file path
   * @param filePath Absolute file path
   * @returns Relative file path
   */
  protected getRelativeFilePath(filePath: string): string {
    // If the file path is already relative, return it as is
    if (!path.isAbsolute(filePath)) {
      return filePath;
    }
    
    // If we have a repository URL, try to make the path relative to the repository root
    if (this.options.repoUrl) {
      // Extract the repository name from the URL
      const repoName = this.options.repoUrl.split('/').pop()?.replace('.git', '');
      
      if (repoName) {
        // Try to find the repository name in the file path
        const repoIndex = filePath.indexOf(repoName);
        
        if (repoIndex !== -1) {
          return filePath.substring(repoIndex + repoName.length + 1);
        }
      }
    }
    
    // If we can't make it relative to the repository, return the basename
    return path.basename(filePath);
  }
  
  /**
   * Get an emoji for a severity
   * @param severity Issue severity
   * @returns Emoji representing the severity
   */
  protected getSeverityEmoji(severity: IssueSeverity): string {
    switch (severity) {
      case IssueSeverity.CRITICAL:
        return '🔴';
      case IssueSeverity.ERROR:
        return '🟠';
      case IssueSeverity.WARNING:
        return '🟡';
      case IssueSeverity.INFO:
        return '🔵';
      default:
        return '⚪';
    }
  }
  
  /**
   * Get an emoji for an issue type
   * @param type Issue type
   * @returns Emoji representing the type
   */
  protected getTypeEmoji(type: IssueType): string {
    switch (type) {
      case IssueType.SECURITY:
        return '🔒';
      case IssueType.BUG:
        return '🐛';
      case IssueType.OPTIMIZATION:
        return '⚡';
      case IssueType.STYLE:
        return '💅';
      case IssueType.OTHER:
        return '📝';
      default:
        return '❓';
    }
  }
} 