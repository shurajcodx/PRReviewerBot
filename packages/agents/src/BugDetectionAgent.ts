import { BaseAgent } from './BaseAgent';
import { CodeIssue, IssueType, IssueSeverity, getFileLanguage } from '@pr-reviewer-bot/core';
import { AIConnector } from '@pr-reviewer-bot/ai-connectors';
import path from 'path';

/**
 * Agent that identifies potential bugs
 */
export class BugDetectionAgent extends BaseAgent {
  private aiConnector: AIConnector;

  /**
   * Create a new BugDetectionAgent
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
    return 'BugDetection';
  }

  /**
   * Analyze a file for potential bugs
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

    // Check for common bugs based on file type
    issues.push(...this.checkCommonBugs(content, filePath));

    // Check for language-specific bugs
    switch (extension) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        issues.push(...this.checkJavaScriptBugs(content, filePath));
        break;
      case '.py':
        issues.push(...this.checkPythonBugs(content, filePath));
        break;
      case '.java':
        issues.push(...this.checkJavaBugs(content, filePath));
        break;
    }

    // Use AI to detect more complex bugs
    const aiIssues = await this.checkWithAI(content, filePath, repoDir);
    issues.push(...aiIssues);

    return issues;
  }

  /**
   * Check for common bugs
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkCommonBugs(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Check for commented out code
    let commentedCodeBlockStart = -1;
    let consecutiveCommentLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if the line is a comment (supports JS/TS, Python, Java, C, C++, etc.)
      const isComment =
        line.startsWith('//') ||
        line.startsWith('#') ||
        line.startsWith('/*') ||
        line.startsWith('*') ||
        line.startsWith('<!--');

      if (isComment && line.length > 3) {
        // Check if the comment contains code-like patterns
        const containsCode =
          /[{};=><\[\]()]/.test(line) ||
          /\bif\b|\bfor\b|\bwhile\b|\bfunction\b|\bclass\b|\bdef\b|\breturn\b/.test(line);

        if (containsCode) {
          if (commentedCodeBlockStart === -1) {
            commentedCodeBlockStart = i;
          }
          consecutiveCommentLines++;
        } else if (consecutiveCommentLines > 0 && !containsCode) {
          // Reset if we find a regular comment
          if (consecutiveCommentLines >= 3) {
            issues.push(
              this.createIssue(
                'Commented out code block',
                'Large blocks of commented out code should be removed.',
                IssueType.BUG,
                IssueSeverity.INFO,
                filePath,
                commentedCodeBlockStart + 1,
                i,
                'Remove the commented out code if it is no longer needed.',
              ),
            );
          }
          commentedCodeBlockStart = -1;
          consecutiveCommentLines = 0;
        }
      } else {
        // If we've been tracking commented code and hit a non-comment line
        if (consecutiveCommentLines >= 3) {
          issues.push(
            this.createIssue(
              'Commented out code block',
              'Large blocks of commented out code should be removed.',
              IssueType.BUG,
              IssueSeverity.INFO,
              filePath,
              commentedCodeBlockStart + 1,
              i,
              'Remove the commented out code if it is no longer needed.',
            ),
          );
        }
        commentedCodeBlockStart = -1;
        consecutiveCommentLines = 0;
      }
    }

    // Check for the last block of commented code
    if (consecutiveCommentLines >= 3) {
      issues.push(
        this.createIssue(
          'Commented out code block',
          'Large blocks of commented out code should be removed.',
          IssueType.BUG,
          IssueSeverity.INFO,
          filePath,
          commentedCodeBlockStart + 1,
          lines.length,
          'Remove the commented out code if it is no longer needed.',
        ),
      );
    }

    return issues;
  }

  /**
   * Check JavaScript/TypeScript bugs
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkJavaScriptBugs(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Check for common JavaScript bugs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for == instead of ===
      if (/[^=!]==[^=]/.test(line)) {
        issues.push(
          this.createIssue(
            'Use of loose equality',
            'Using == instead of === can lead to unexpected type coercion.',
            IssueType.BUG,
            IssueSeverity.WARNING,
            filePath,
            i + 1,
            i + 1,
            'Replace == with === for strict equality comparison.',
          ),
        );
      }

      // Check for potential array index out of bounds
      if (/\[\d+\]/.test(line) && !/\.length/.test(line) && !/(for|while)\s*\(/.test(line)) {
        issues.push(
          this.createIssue(
            'Potential array index out of bounds',
            'Accessing array elements with hardcoded indices without checking array length.',
            IssueType.BUG,
            IssueSeverity.WARNING,
            filePath,
            i + 1,
            i + 1,
            'Add a check to ensure the index is within the array bounds.',
          ),
        );
      }

      // Check for potential null/undefined dereference
      if (
        /\w+\.\w+/.test(line) &&
        !line.includes('?') &&
        !line.includes('&&') &&
        !line.includes('||')
      ) {
        const matches = line.match(/(\w+)\.\w+/g);
        if (matches) {
          for (const match of matches) {
            const obj = match.split('.')[0];
            if (
              ![
                'this',
                'self',
                'window',
                'document',
                'console',
                'process',
                'module',
                'require',
                'exports',
              ].includes(obj)
            ) {
              issues.push(
                this.createIssue(
                  'Potential null/undefined dereference',
                  `Accessing properties of '${obj}' without checking if it's null or undefined.`,
                  IssueType.BUG,
                  IssueSeverity.WARNING,
                  filePath,
                  i + 1,
                  i + 1,
                  `Add a null check: if (${obj}) { ... } or use optional chaining: ${obj}?.property`,
                ),
              );
              break; // Only report once per line
            }
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check Python bugs
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkPythonBugs(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Check for common Python bugs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for mutable default arguments
      if (
        /def\s+\w+\s*\(.*=\s*\[\s*\].*\)/.test(line) ||
        /def\s+\w+\s*\(.*=\s*\{\s*\}.*\)/.test(line)
      ) {
        issues.push(
          this.createIssue(
            'Mutable default argument',
            'Using mutable objects as default arguments can lead to unexpected behavior.',
            IssueType.BUG,
            IssueSeverity.WARNING,
            filePath,
            i + 1,
            i + 1,
            'Use None as the default and initialize the mutable object inside the function.',
          ),
        );
      }

      // Check for except without specific exceptions
      if (
        /except\s*:/.test(line) &&
        !line.includes('Exception') &&
        !line.includes('BaseException')
      ) {
        issues.push(
          this.createIssue(
            'Bare except clause',
            'Using a bare except clause can catch unexpected exceptions and hide errors.',
            IssueType.BUG,
            IssueSeverity.WARNING,
            filePath,
            i + 1,
            i + 1,
            'Specify the exceptions you want to catch: except (TypeError, ValueError):',
          ),
        );
      }
    }

    return issues;
  }

  /**
   * Check Java bugs
   * @param content File content
   * @param filePath File path
   * @returns Array of code issues
   */
  private checkJavaBugs(content: string, filePath: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Check for common Java bugs
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for potential null pointer dereference
      if (
        /\w+\.\w+/.test(line) &&
        !line.includes('!=') &&
        !line.includes('==') &&
        !line.includes('null')
      ) {
        const matches = line.match(/(\w+)\.\w+/g);
        if (matches) {
          for (const match of matches) {
            const obj = match.split('.')[0];
            if (
              ![
                'this',
                'super',
                'System',
                'Math',
                'String',
                'Integer',
                'Boolean',
                'Double',
                'Float',
                'Long',
              ].includes(obj)
            ) {
              issues.push(
                this.createIssue(
                  'Potential null pointer dereference',
                  `Accessing methods or properties of '${obj}' without checking for null.`,
                  IssueType.BUG,
                  IssueSeverity.WARNING,
                  filePath,
                  i + 1,
                  i + 1,
                  `Add a null check: if (${obj} != null) { ... }`,
                ),
              );
              break; // Only report once per line
            }
          }
        }
      }

      // Check for empty catch blocks
      if (
        /catch\s*\([^)]+\)\s*\{\s*\}/.test(line) ||
        (line.includes('catch') && i + 1 < lines.length && lines[i + 1].trim() === '}')
      ) {
        issues.push(
          this.createIssue(
            'Empty catch block',
            'Empty catch blocks suppress exceptions without handling them.',
            IssueType.BUG,
            IssueSeverity.WARNING,
            filePath,
            i + 1,
            i + 1,
            'Either handle the exception or log it.',
          ),
        );
      }
    }

    return issues;
  }

  /**
   * Use AI to check for bugs
   * @param content File content
   * @param filePath File path
   * @param repoDir Repository directory
   * @returns Array of code issues
   */
  private async checkWithAI(
    content: string,
    filePath: string,
    repoDir: string,
  ): Promise<CodeIssue[]> {
    // Get the language of the file
    const language = getFileLanguage(filePath) || 'Unknown';

    // Get the relative path
    const relativePath = this.getRelativePath(filePath, repoDir);

    // Create the prompt
    const prompt = this.createBugPrompt(content, language, relativePath);

    // Send the prompt to the AI
    const response = await this.aiConnector.generateResponse(prompt);

    // Parse the response
    return this.parseResponse(response, filePath);
  }

  /**
   * Create a bug-focused prompt for the AI
   * @param content File content
   * @param language File language
   * @param filePath File path
   * @returns Prompt
   */
  private createBugPrompt(content: string, language: string, filePath: string): string {
    return `
You are a bug detection expert analyzing code for potential bugs and logical errors. Please review the following ${language} code from the file ${filePath} and identify any bugs or issues, including but not limited to:

1. Logic errors
2. Off-by-one errors
3. Null/undefined dereferences
4. Memory leaks
5. Race conditions
6. Infinite loops
7. Resource leaks
8. Exception handling issues
9. Type errors
10. Boundary condition errors

For each issue, provide:
- A brief title
- A detailed description of the bug
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
    "severity": "error",
    "suggestedFix": "Code suggestion to fix the issue"
  }
]
\`\`\`

Here is the code to review:

\`\`\`${language}
${content}
\`\`\`

If no bugs are found, return an empty array: []
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
            severity = IssueSeverity.WARNING; // Default to WARNING for bugs
        }

        return this.createIssue(
          issue.title,
          issue.description,
          IssueType.BUG,
          severity,
          filePath,
          issue.lineStart,
          issue.lineEnd,
          issue.suggestedFix,
        );
      });
    } catch (error) {
      console.warn(`Warning: Could not parse AI response: ${error}`);

      return [];
    }
  }
}
