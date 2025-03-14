import { BaseAgent } from './BaseAgent';
import { CodeIssue, IssueType, IssueSeverity, getFileLanguage } from '@pr-reviewer-bot/core';
import { AIConnector } from '@pr-reviewer-bot/ai-connectors';
import path from 'path';

/**
 * Agent that detects security vulnerabilities
 */
export class SecurityAgent extends BaseAgent {
  private aiConnector: AIConnector;
  
  /**
   * Create a new SecurityAgent
   * @param aiConnector AI connector
   */
  constructor(aiConnector: AIConnector) {
    super();
    this.aiConnector = aiConnector;
  }
  
  /**
   * Get the name of the agent
   */
  get name(): string {
    return 'Security';
  }
  
  /**
   * Analyze a file for security issues
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
    
    // Check for common security issues based on file type
    issues.push(...this.checkCommonSecurityIssues(content, filePath));
    
    // Check for language-specific security issues
    switch (extension) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        issues.push(...this.checkJavaScriptSecurity(content, filePath));
        break;
      case '.py':
        issues.push(...this.checkPythonSecurity(content, filePath));
        break;
      case '.java':
        issues.push(...this.checkJavaSecurity(content, filePath));
        break;
      case '.php':
        issues.push(...this.checkPhpSecurity(content, filePath));
        break;
    }
    
    // Use AI to detect more complex security issues
    const aiIssues = await this.checkWithAI(content, filePath, repoDir);
    issues.push(...aiIssues);
    
    return issues;
  }
  
  /**
   * Check for common security issues
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkCommonSecurityIssues(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for hardcoded secrets
    const secretPatterns = [
      { pattern: /(?:password|passwd|pwd).*?[=:]\s*['"](?!.*\$\{)([^'"]{8,})['"]/i, name: 'Password' },
      { pattern: /(?:api[_-]?key|apikey|token).*?[=:]\s*['"]([^'"]{8,})['"]/i, name: 'API Key' },
      { pattern: /(?:secret|private[_-]?key).*?[=:]\s*['"]([^'"]{8,})['"]/i, name: 'Secret' },
      { pattern: /(?:aws[_-]?access[_-]?key[_-]?id).*?[=:]\s*['"]([A-Z0-9]{20})['"]/i, name: 'AWS Access Key' },
      { pattern: /(?:aws[_-]?secret[_-]?access[_-]?key).*?[=:]\s*['"]([A-Za-z0-9\/+=]{40})['"]/i, name: 'AWS Secret Key' }
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, name } of secretPatterns) {
        if (pattern.test(line)) {
          issues.push(this.createIssue(
            `Hardcoded ${name}`,
            `Hardcoded ${name.toLowerCase()} found in the code. This is a security risk.`,
            IssueType.SECURITY,
            IssueSeverity.CRITICAL,
            filePath,
            i + 1,
            i + 1,
            'Move the secret to environment variables or a secure vault.'
          ));
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check JavaScript/TypeScript security
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkJavaScriptSecurity(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for eval
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/\beval\s*\(/.test(line)) {
        issues.push(this.createIssue(
          'Use of eval',
          'The eval function is dangerous as it can execute arbitrary code.',
          IssueType.SECURITY,
          IssueSeverity.ERROR,
          filePath,
          i + 1,
          i + 1,
          'Avoid using eval. Use safer alternatives.'
        ));
      }
      
      // Check for innerHTML
      if (/\.innerHTML\s*=/.test(line)) {
        issues.push(this.createIssue(
          'Use of innerHTML',
          'Using innerHTML can lead to XSS vulnerabilities if the content is not properly sanitized.',
          IssueType.SECURITY,
          IssueSeverity.WARNING,
          filePath,
          i + 1,
          i + 1,
          'Use textContent or DOM methods instead, or sanitize the HTML content.'
        ));
      }
      
      // Check for document.write
      if (/document\.write\s*\(/.test(line)) {
        issues.push(this.createIssue(
          'Use of document.write',
          'document.write can lead to XSS vulnerabilities and is generally considered bad practice.',
          IssueType.SECURITY,
          IssueSeverity.WARNING,
          filePath,
          i + 1,
          i + 1,
          'Use DOM manipulation methods instead.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Check Python security
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkPythonSecurity(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for exec/eval
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/\b(?:exec|eval)\s*\(/.test(line)) {
        issues.push(this.createIssue(
          'Use of exec/eval',
          'The exec/eval functions are dangerous as they can execute arbitrary code.',
          IssueType.SECURITY,
          IssueSeverity.ERROR,
          filePath,
          i + 1,
          i + 1,
          'Avoid using exec/eval. Use safer alternatives.'
        ));
      }
      
      // Check for shell=True
      if (/subprocess\.(?:call|Popen|run).*shell\s*=\s*True/.test(line)) {
        issues.push(this.createIssue(
          'Use of shell=True',
          'Using shell=True with subprocess functions can lead to shell injection vulnerabilities.',
          IssueType.SECURITY,
          IssueSeverity.ERROR,
          filePath,
          i + 1,
          i + 1,
          'Avoid using shell=True. Pass arguments as a list instead.'
        ));
      }
      
      // Check for pickle
      if (/\bpickle\.(?:loads|load)\s*\(/.test(line)) {
        issues.push(this.createIssue(
          'Use of pickle',
          'The pickle module is not secure against maliciously constructed data.',
          IssueType.SECURITY,
          IssueSeverity.WARNING,
          filePath,
          i + 1,
          i + 1,
          'Use a safer serialization format like JSON.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Check Java security
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkJavaSecurity(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for Runtime.exec
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/Runtime\.getRuntime\(\)\.exec\s*\(/.test(line)) {
        issues.push(this.createIssue(
          'Use of Runtime.exec',
          'Using Runtime.exec can lead to command injection vulnerabilities if user input is not properly sanitized.',
          IssueType.SECURITY,
          IssueSeverity.WARNING,
          filePath,
          i + 1,
          i + 1,
          'Validate and sanitize any user input used in the command.'
        ));
      }
      
      // Check for SQL concatenation
      if (/(?:executeQuery|executeUpdate)\s*\(\s*['"]\s*SELECT|INSERT|UPDATE|DELETE.*\+/.test(line)) {
        issues.push(this.createIssue(
          'SQL Injection risk',
          'Concatenating strings to build SQL queries can lead to SQL injection vulnerabilities.',
          IssueType.SECURITY,
          IssueSeverity.ERROR,
          filePath,
          i + 1,
          i + 1,
          'Use prepared statements or parameterized queries.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Check PHP security
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkPhpSecurity(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');
    
    // Check for eval
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/\beval\s*\(/.test(line)) {
        issues.push(this.createIssue(
          'Use of eval',
          'The eval function is dangerous as it can execute arbitrary code.',
          IssueType.SECURITY,
          IssueSeverity.ERROR,
          filePath,
          i + 1,
          i + 1,
          'Avoid using eval. Use safer alternatives.'
        ));
      }
      
      // Check for shell_exec
      if (/\b(?:shell_exec|exec|system|passthru|`)\s*\(/.test(line) || /`.*`/.test(line)) {
        issues.push(this.createIssue(
          'Use of shell commands',
          'Using shell commands can lead to command injection vulnerabilities if user input is not properly sanitized.',
          IssueType.SECURITY,
          IssueSeverity.ERROR,
          filePath,
          i + 1,
          i + 1,
          'Validate and sanitize any user input used in the command.'
        ));
      }
      
      // Check for SQL concatenation
      if (/mysql_query\s*\(\s*['"]\s*SELECT|INSERT|UPDATE|DELETE.*\$/.test(line)) {
        issues.push(this.createIssue(
          'SQL Injection risk',
          'Concatenating variables to build SQL queries can lead to SQL injection vulnerabilities.',
          IssueType.SECURITY,
          IssueSeverity.ERROR,
          filePath,
          i + 1,
          i + 1,
          'Use prepared statements or parameterized queries.'
        ));
      }
    }
    
    return issues;
  }
  
  /**
   * Use AI to check for security issues
   * @param content File content
   * @param filePath File path
   * @param repoDir Repository directory
   * @returns Array of code issues
   */
  private async checkWithAI(content: string, filePath: string, repoDir: string): Promise<CodeIssue[]> {
    // Get the language of the file
    const language = getFileLanguage(filePath) || 'Unknown';
    
    // Get the relative path
    const relativePath = this.getRelativePath(filePath, repoDir);
    
    // Create the prompt
    const prompt = this.createSecurityPrompt(content, language, relativePath);
    
    // Send the prompt to the AI
    const response = await this.aiConnector.generateResponse(prompt);
    
    // Parse the response
    return this.parseResponse(response, filePath);
  }
  
  /**
   * Create a security-focused prompt for the AI
   * @param content File content
   * @param language File language
   * @param filePath File path
   * @returns Prompt
   */
  private createSecurityPrompt(content: string, language: string, filePath: string): string {
    return `
You are a security expert analyzing code for security vulnerabilities. Please review the following ${language} code from the file ${filePath} and identify any security issues, including but not limited to:

1. Injection vulnerabilities (SQL, Command, etc.)
2. Cross-site scripting (XSS)
3. Insecure cryptography
4. Hardcoded credentials
5. Insecure direct object references
6. Security misconfiguration
7. Sensitive data exposure
8. Missing authentication or authorization
9. CSRF vulnerabilities
10. Known vulnerable components

For each issue, provide:
- A brief title
- A detailed description of the vulnerability
- The line number(s) where the issue occurs
- The severity (info, warning, error, critical)
- A suggested fix

Format your response as a JSON array of issues, with each issue having the following structure:
\`\`\`json
[
  {
    "title": "Issue title",
    "description": "Detailed description",
    "lineStart": 10,
    "lineEnd": 15,
    "severity": "critical",
    "suggestedFix": "Code suggestion to fix the issue"
  }
]
\`\`\`

Here is the code to review:

\`\`\`${language}
${content}
\`\`\`

If no security issues are found, return an empty array: []
`;
  }
  
  /**
   * Parse the AI response into code issues
   * @param response AI response
   * @param filePath File path
   * @returns Array of code issues
   */
  private parseResponse(response: string, filePath: string): CodeIssue[] {
    try {
      // Extract JSON from the response
      const jsonMatch = response.match(/\[\s*\{.*\}\s*\]/s);
      if (!jsonMatch) {
        return [];
      }
      
      const jsonStr = jsonMatch[0];
      const issues = JSON.parse(jsonStr);
      
      // Convert to CodeIssue format
      return issues.map((issue: any) => {
        // Map severity
        let severity: IssueSeverity;
        switch (issue.severity?.toLowerCase()) {
          case 'info':
            severity = IssueSeverity.INFO;
            break;
          case 'warning':
            severity = IssueSeverity.WARNING;
            break;
          case 'error':
            severity = IssueSeverity.ERROR;
            break;
          case 'critical':
            severity = IssueSeverity.CRITICAL;
            break;
          default:
            severity = IssueSeverity.ERROR; // Default to ERROR for security issues
        }
        
        return this.createIssue(
          issue.title,
          issue.description,
          IssueType.SECURITY,
          severity,
          filePath,
          issue.lineStart,
          issue.lineEnd,
          issue.suggestedFix
        );
      });
    } catch (error) {
      console.warn(`Warning: Could not parse AI response: ${error}`);
      return [];
    }
  }
} 