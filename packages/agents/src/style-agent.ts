import { BaseAgent } from './BaseAgent';
import { CodeIssue, IssueType, IssueSeverity } from './types';
import path from 'path';

/**
 * Agent that checks code style compliance
 */
export class StyleAgent extends BaseAgent {
  /**
   * Get the name of the agent
   */
  get name(): string {
    return 'Style';
  }
  
  /**
   * Analyze a file for style issues
   * @param filePath Path to the file
   * @param content Content of the file
   * @param repoDir Repository directory
   * @returns Array of code issues
   */
  async analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]> {
    // Skip empty files
    if (!content.trim()) {
      return [];
    }
    
    const issues: CodeIssue[] = [];
    const relativePath = this.getRelativePath(filePath, repoDir);
    const extension = path.extname(filePath).toLowerCase();
    
    // Check for common style issues based on file type
    switch (extension) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        issues.push(...this.checkJavaScriptStyle(content, filePath));
        break;
      case '.py':
        issues.push(...this.checkPythonStyle(content, filePath));
        break;
      case '.java':
        issues.push(...this.checkJavaStyle(content, filePath));
        break;
    }
    
    // Check for trailing whitespace and consistent line endings
    issues.push(...this.checkWhitespace(content, filePath));
    
    return issues;
  }
  
  /**
   * Check JavaScript/TypeScript style
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkJavaScriptStyle(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for console.log statements
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('console.log(')) {
        issues.push(this.createIssue(
          'Console statement found',
          'Console statements should be removed in production code.',
          IssueType.STYLE,
          IssueSeverity.INFO,
          filePath,
          i + 1,
          i + 1,
          'Remove or comment out the console.log statement.'
        ));
      }
      
      // Check for very long lines
      if (line.length > 100) {
        issues.push(this.createIssue(
          'Line too long',
          'Lines should be limited to 100 characters for readability.',
          IssueType.STYLE,
          IssueSeverity.INFO,
          filePath,
          i + 1,
          i + 1,
          'Break the line into multiple lines.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Check Python style
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkPythonStyle(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for print statements
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('print(')) {
        issues.push(this.createIssue(
          'Print statement found',
          'Print statements should be removed in production code.',
          IssueType.STYLE,
          IssueSeverity.INFO,
          filePath,
          i + 1,
          i + 1,
          'Remove or comment out the print statement.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Check Java style
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkJavaStyle(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for System.out.println statements
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('System.out.println') || line.includes('System.err.println')) {
        issues.push(this.createIssue(
          'System.out statement found',
          'System.out statements should be replaced with proper logging.',
          IssueType.STYLE,
          IssueSeverity.INFO,
          filePath,
          i + 1,
          i + 1,
          'Replace with a logger statement.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Check whitespace issues
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkWhitespace(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for trailing whitespace
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.trimEnd() !== line) {
        issues.push(this.createIssue(
          'Trailing whitespace',
          'Lines should not have trailing whitespace.',
          IssueType.STYLE,
          IssueSeverity.INFO,
          filePath,
          i + 1,
          i + 1,
          'Remove trailing whitespace.'
        ));
      }
    }
    
    return issues;
  }
} 