import { CodeIssue, IssueType, IssueSeverity } from '@pr-reviewer-bot/agents';
import { BaseOutputHandler } from '../base/BaseOutputHandler';
import { OutputHandlerOptions } from '../interfaces/OutputHandler';
import { Octokit } from '@octokit/rest';

/**
 * Handler for outputting code issues as GitHub PR comments
 */
export class GitHubPROutputHandler extends BaseOutputHandler {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  
  /**
   * Create a new GitHub PR output handler
   * @param options Output handler options
   */
  constructor(options: OutputHandlerOptions) {
    super(options);
    
    if (!this.options.gitToken) {
      throw new Error('GitHub token is required for GitHubPROutputHandler');
    }
    
    if (!this.options.prNumber) {
      throw new Error('PR number is required for GitHubPROutputHandler');
    }
    
    if (!this.options.repoUrl) {
      throw new Error('Repository URL is required for GitHubPROutputHandler');
    }
    
    // Initialize Octokit
    this.octokit = new Octokit({
      auth: this.options.gitToken
    });
    
    // Parse owner and repo from repoUrl
    const repoUrlMatch = this.options.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoUrlMatch) {
      throw new Error(`Invalid GitHub repository URL: ${this.options.repoUrl}`);
    }
    
    [, this.owner, this.repo] = repoUrlMatch;
    // Remove .git suffix if present
    this.repo = this.repo.replace(/\.git$/, '');
  }
  
  /**
   * Handle the output of code issues
   * @param issues Array of code issues
   * @returns Promise that resolves when the output is handled
   */
  async handleOutput(issues: CodeIssue[]): Promise<void> {
    if (issues.length === 0) {
      console.log('No issues found.');
      await this.createSummaryComment('No issues found in this PR.');
      return;
    }
    
    // Create a summary comment
    await this.createSummaryComment(this.generateSummary(issues));
    
    // Create review comments for each issue
    await this.createReviewComments(issues);
  }
  
  /**
   * Create a summary comment on the PR
   * @param content Comment content
   */
  private async createSummaryComment(content: string): Promise<void> {
    try {
      await this.octokit.issues.createComment({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.options.prNumber!,
        body: content
      });
      
      console.log('Created summary comment on PR');
    } catch (error) {
      console.error('Failed to create summary comment:', error);
      throw error;
    }
  }
  
  /**
   * Create review comments for each issue
   * @param issues Array of code issues
   */
  private async createReviewComments(issues: CodeIssue[]): Promise<void> {
    try {
      // Create a new review
      const review = await this.octokit.pulls.createReview({
        owner: this.owner,
        repo: this.repo,
        pull_number: this.options.prNumber!,
        event: 'COMMENT',
        comments: await this.formatReviewComments(issues)
      });
      
      console.log(`Created review with ${issues.length} comments`);
    } catch (error) {
      console.error('Failed to create review comments:', error);
      throw error;
    }
  }
  
  /**
   * Format issues as review comments
   * @param issues Array of code issues
   * @returns Array of review comments
   */
  private async formatReviewComments(issues: CodeIssue[]): Promise<any[]> {
    const comments = [];
    
    // Get the PR diff to find the correct position for comments
    const diff = await this.getPRDiff();
    
    for (const issue of issues) {
      // Skip issues without line information
      if (!issue.location.startLine) {
        continue;
      }
      
      const position = this.findPositionInDiff(diff, issue.location.filePath, issue.location.startLine);
      
      // Skip if we couldn't find the position in the diff
      if (position === null) {
        console.warn(`Could not find position for comment in file ${issue.location.filePath} at line ${issue.location.startLine}`);
        continue;
      }
      
      const body = this.formatIssueComment(issue);
      
      comments.push({
        path: issue.location.filePath,
        line: issue.location.startLine,
        side: 'RIGHT',
        body
      });
    }
    
    return comments;
  }
  
  /**
   * Get the PR diff
   * @returns PR diff
   */
  private async getPRDiff(): Promise<string> {
    try {
      const response = await this.octokit.pulls.get({
        owner: this.owner,
        repo: this.repo,
        pull_number: this.options.prNumber!,
        mediaType: {
          format: 'diff'
        }
      });
      
      return response.data as unknown as string;
    } catch (error) {
      console.error('Failed to get PR diff:', error);
      throw error;
    }
  }
  
  /**
   * Find the position of a line in the diff
   * @param diff PR diff
   * @param filePath File path
   * @param line Line number
   * @returns Position in diff or null if not found
   */
  private findPositionInDiff(diff: string, filePath: string, line: number): number | null {
    // This is a simplified implementation
    // In a real implementation, you would need to parse the diff to find the correct position
    // For now, we'll just return a placeholder
    return 1;
  }
  
  /**
   * Format an issue as a review comment
   * @param issue Code issue
   * @returns Comment body
   */
  private formatIssueComment(issue: CodeIssue): string {
    let comment = `### ${this.getSeverityEmoji(issue.severity)} ${this.getTypeEmoji(issue.type)} ${issue.title}\n\n`;
    comment += `${issue.description}\n\n`;
    
    if (issue.suggestedFix) {
      comment += `**Suggested Fix**:\n\`\`\`\n${issue.suggestedFix}\n\`\`\`\n\n`;
    }
    
    comment += `*Detected by: ${issue.agent}*`;
    
    return comment;
  }
  
  /**
   * Generate summary content
   * @param issues Array of code issues
   * @returns Summary content
   */
  private generateSummary(issues: CodeIssue[]): string {
    let summary = '# PR Review Results\n\n';
    
    // Count issues by severity
    const criticalCount = issues.filter(issue => issue.severity === IssueSeverity.CRITICAL).length;
    const errorCount = issues.filter(issue => issue.severity === IssueSeverity.ERROR).length;
    const warningCount = issues.filter(issue => issue.severity === IssueSeverity.WARNING).length;
    const infoCount = issues.filter(issue => issue.severity === IssueSeverity.INFO).length;
    
    summary += `## Summary\n\n`;
    summary += `- **Total Issues**: ${issues.length}\n`;
    summary += `- **Critical**: ${criticalCount}\n`;
    summary += `- **Error**: ${errorCount}\n`;
    summary += `- **Warning**: ${warningCount}\n`;
    summary += `- **Info**: ${infoCount}\n\n`;
    
    // Count issues by type
    const securityCount = issues.filter(issue => issue.type === IssueType.SECURITY).length;
    const styleCount = issues.filter(issue => issue.type === IssueType.STYLE).length;
    const bugCount = issues.filter(issue => issue.type === IssueType.BUG).length;
    const optimizationCount = issues.filter(issue => issue.type === IssueType.OPTIMIZATION).length;
    const otherCount = issues.filter(issue => issue.type === IssueType.OTHER).length;
    
    summary += `- **Security Issues**: ${securityCount}\n`;
    summary += `- **Style Issues**: ${styleCount}\n`;
    summary += `- **Bug Issues**: ${bugCount}\n`;
    summary += `- **Optimization Issues**: ${optimizationCount}\n`;
    summary += `- **Other Issues**: ${otherCount}\n\n`;
    
    summary += `*Individual issues are added as review comments on the relevant lines.*`;
    
    return summary;
  }
} 