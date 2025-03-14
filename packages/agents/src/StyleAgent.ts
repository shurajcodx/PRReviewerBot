import { BaseAgent } from './BaseAgent';
import { CodeIssue, IssueType, IssueSeverity } from '@pr-reviewer-bot/core';
import path from 'path';
import fs from 'fs-extra';

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
      case '.html':
      case '.xml':
        issues.push(...this.checkMarkupStyle(content, filePath));
        break;
      case '.css':
      case '.scss':
      case '.less':
        issues.push(...this.checkCssStyle(content, filePath));
        break;
    }
    
    // Check for configuration files
    if (this.isConfigFile(relativePath)) {
      issues.push(...this.checkConfigFile(content, filePath));
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
      
      // Check for TODO comments
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push(this.createIssue(
          'TODO comment found',
          'TODO comments should be addressed or converted to issues.',
          IssueType.STYLE,
          IssueSeverity.INFO,
          filePath,
          i + 1,
          i + 1,
          'Address the TODO or create an issue and reference it in the comment.'
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
      
      // Check for very long lines
      if (line.length > 88) {
        issues.push(this.createIssue(
          'Line too long',
          'Lines should be limited to 88 characters for readability (PEP 8).',
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
   * Check HTML/XML style
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkMarkupStyle(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for very long lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.length > 120) {
        issues.push(this.createIssue(
          'Line too long',
          'Lines should be limited to 120 characters for readability.',
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
   * Check CSS style
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkCssStyle(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for !important
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('!important')) {
        issues.push(this.createIssue(
          '!important found',
          'Avoid using !important as it makes styles difficult to override.',
          IssueType.STYLE,
          IssueSeverity.WARNING,
          filePath,
          i + 1,
          i + 1,
          'Refactor the CSS to avoid using !important.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Check configuration files
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkConfigFile(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    
    // Check for JSON format
    if (filePath.endsWith('.json')) {
      try {
        JSON.parse(content);
      } catch (error) {
        issues.push(this.createIssue(
          'Invalid JSON',
          `The JSON file is not valid: ${error.message}`,
          IssueType.STYLE,
          IssueSeverity.ERROR,
          filePath,
          undefined,
          undefined,
          'Fix the JSON syntax error.'
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
    
    // Check for mixed line endings
    const crlfCount = (content.match(/\r\n/g) || []).length;
    const lfCount = (content.match(/[^\r]\n/g) || []).length;
    
    if (crlfCount > 0 && lfCount > 0) {
      issues.push(this.createIssue(
        'Mixed line endings',
        'File contains mixed line endings (CRLF and LF).',
        IssueType.STYLE,
        IssueSeverity.WARNING,
        filePath,
        undefined,
        undefined,
        'Standardize on a single line ending style (preferably LF).'
      ));
    }
    
    return issues;
  }
  
  /**
   * Check if a file is a configuration file
   * @param filePath File path
   * @returns True if the file is a configuration file
   */
  private isConfigFile(filePath: string): boolean {
    const configFiles = [
      '.eslintrc',
      '.prettierrc',
      '.babelrc',
      'tsconfig.json',
      'package.json',
      'webpack.config.js',
      'jest.config.js',
      'vite.config.js',
      '.gitignore',
      '.dockerignore',
      'Dockerfile',
      'docker-compose.yml',
      '.env',
      'requirements.txt',
      'pyproject.toml',
      'setup.py',
      'pom.xml',
      'build.gradle'
    ];
    
    const fileName = path.basename(filePath);
    return configFiles.includes(fileName) || fileName.startsWith('.') || fileName.endsWith('.config.js');
  }
} 