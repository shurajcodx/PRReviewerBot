import { CodeIssue, IssueType, IssueSeverity } from '@pr-reviewer-bot/agents';
import { BaseOutputHandler } from '../base/BaseOutputHandler';
import { OutputHandlerOptions } from '../interfaces/OutputHandler';
import fs from 'fs-extra';
import path from 'path';

/**
 * Handler for outputting code issues to a file
 */
export class FileOutputHandler extends BaseOutputHandler {
  /**
   * Create a new file output handler
   * @param options Output handler options
   */
  constructor(options: OutputHandlerOptions) {
    super(options);

    // Set default file path if not provided
    if (!this.options.filePath) {
      this.options.filePath = './pr-review-results.md';
    }
  }

  /**
   * Handle the output of code issues
   * @param issues Array of code issues
   * @returns Promise that resolves when the output is handled
   */
  async handleOutput(issues: CodeIssue[]): Promise<void> {
    if (issues.length === 0) {
      console.log('No issues found.');
      return;
    }

    // Generate the markdown content
    let markdown = this.generateMarkdown(issues);

    // Ensure the directory exists
    await fs.ensureDir(path.dirname(this.options.filePath!));

    // Write the markdown to the file
    await fs.writeFile(this.options.filePath!, markdown, 'utf-8');

    console.log(`Review results saved to ${this.options.filePath}`);
  }

  /**
   * Generate markdown content for the issues
   * @param issues Array of code issues
   * @returns Markdown content
   */
  private generateMarkdown(issues: CodeIssue[]): string {
    let markdown = '# PR Review Results\n\n';

    // Add summary
    markdown += this.generateSummary(issues);

    // Add issues
    if (this.options.groupByFile) {
      markdown += this.generateIssuesByFile(issues);
    } else if (this.options.groupByType) {
      markdown += this.generateIssuesByType(issues);
    } else if (this.options.groupBySeverity) {
      markdown += this.generateIssuesBySeverity(issues);
    } else {
      markdown += this.generateIssuesList(issues);
    }

    return markdown;
  }

  /**
   * Generate summary section
   * @param issues Array of code issues
   * @returns Markdown content
   */
  private generateSummary(issues: CodeIssue[]): string {
    let markdown = '## Summary\n\n';

    // Count issues by severity
    const criticalCount = issues.filter(issue => issue.severity === IssueSeverity.CRITICAL).length;
    const errorCount = issues.filter(issue => issue.severity === IssueSeverity.ERROR).length;
    const warningCount = issues.filter(issue => issue.severity === IssueSeverity.WARNING).length;
    const infoCount = issues.filter(issue => issue.severity === IssueSeverity.INFO).length;

    markdown += `- **Total Issues**: ${issues.length}\n`;
    markdown += `- **Critical**: ${criticalCount}\n`;
    markdown += `- **Error**: ${errorCount}\n`;
    markdown += `- **Warning**: ${warningCount}\n`;
    markdown += `- **Info**: ${infoCount}\n\n`;

    // Count issues by type
    const securityCount = issues.filter(issue => issue.type === IssueType.SECURITY).length;
    const styleCount = issues.filter(issue => issue.type === IssueType.STYLE).length;
    const bugCount = issues.filter(issue => issue.type === IssueType.BUG).length;
    const optimizationCount = issues.filter(issue => issue.type === IssueType.OPTIMIZATION).length;
    const otherCount = issues.filter(issue => issue.type === IssueType.OTHER).length;

    markdown += `- **Security Issues**: ${securityCount}\n`;
    markdown += `- **Style Issues**: ${styleCount}\n`;
    markdown += `- **Bug Issues**: ${bugCount}\n`;
    markdown += `- **Optimization Issues**: ${optimizationCount}\n`;
    markdown += `- **Other Issues**: ${otherCount}\n\n`;

    return markdown;
  }

  /**
   * Generate issues grouped by file
   * @param issues Array of code issues
   * @returns Markdown content
   */
  private generateIssuesByFile(issues: CodeIssue[]): string {
    let markdown = '## Issues by File\n\n';

    const groupedIssues = this.groupIssuesByFile(issues);

    for (const [filePath, fileIssues] of groupedIssues.entries()) {
      const relativePath = this.getRelativeFilePath(filePath);
      markdown += `### ${relativePath}\n\n`;

      const sortedIssues = this.sortIssuesBySeverity(fileIssues);

      for (const issue of sortedIssues) {
        markdown += this.formatIssue(issue);
      }
    }

    return markdown;
  }

  /**
   * Generate issues grouped by type
   * @param issues Array of code issues
   * @returns Markdown content
   */
  private generateIssuesByType(issues: CodeIssue[]): string {
    let markdown = '## Issues by Type\n\n';

    const groupedIssues = this.groupIssuesByType(issues);

    // Define the order of issue types
    const typeOrder = [
      IssueType.SECURITY,
      IssueType.BUG,
      IssueType.OPTIMIZATION,
      IssueType.STYLE,
      IssueType.OTHER,
    ];

    for (const type of typeOrder) {
      if (groupedIssues.has(type)) {
        const typeIssues = groupedIssues.get(type)!;

        markdown += `### ${this.getTypeEmoji(type)} ${type} Issues\n\n`;

        const sortedIssues = this.sortIssuesBySeverity(typeIssues);

        for (const issue of sortedIssues) {
          markdown += this.formatIssue(issue);
        }
      }
    }

    return markdown;
  }

  /**
   * Generate issues grouped by severity
   * @param issues Array of code issues
   * @returns Markdown content
   */
  private generateIssuesBySeverity(issues: CodeIssue[]): string {
    let markdown = '## Issues by Severity\n\n';

    const groupedIssues = this.groupIssuesBySeverity(issues);

    // Define the order of issue severities
    const severityOrder = [
      IssueSeverity.CRITICAL,
      IssueSeverity.ERROR,
      IssueSeverity.WARNING,
      IssueSeverity.INFO,
    ];

    for (const severity of severityOrder) {
      if (groupedIssues.has(severity)) {
        const severityIssues = groupedIssues.get(severity)!;

        markdown += `### ${this.getSeverityEmoji(severity)} ${severity} Issues\n\n`;

        for (const issue of severityIssues) {
          markdown += this.formatIssue(issue);
        }
      }
    }

    return markdown;
  }

  /**
   * Generate a list of all issues
   * @param issues Array of code issues
   * @returns Markdown content
   */
  private generateIssuesList(issues: CodeIssue[]): string {
    let markdown = '## All Issues\n\n';

    const sortedIssues = this.sortIssuesBySeverity(issues);

    for (const issue of sortedIssues) {
      markdown += this.formatIssue(issue);
    }

    return markdown;
  }

  /**
   * Format a single issue
   * @param issue Code issue
   * @returns Markdown content
   */
  private formatIssue(issue: CodeIssue): string {
    const relativePath = this.getRelativeFilePath(issue.location.filePath);
    const location = issue.location.startLine
      ? `${relativePath}:${issue.location.startLine}${issue.location.endLine && issue.location.endLine !== issue.location.startLine ? `-${issue.location.endLine}` : ''}`
      : relativePath;

    let markdown = `#### ${this.getSeverityEmoji(issue.severity)} ${this.getTypeEmoji(issue.type)} ${issue.title}\n\n`;
    markdown += `**Location**: \`${location}\`\n\n`;
    markdown += `**Description**: ${issue.description}\n\n`;

    if (issue.suggestedFix) {
      markdown += `**Suggested Fix**:\n\n\`\`\`\n${issue.suggestedFix}\n\`\`\`\n\n`;
    }

    markdown += `**Detected by**: ${issue.agent}\n\n`;

    markdown += '---\n\n';

    return markdown;
  }
}
