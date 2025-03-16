import { AIConnector } from '@pr-reviewer-bot/ai-connectors';
import { BaseAgent } from './BaseAgent';
import { CodeIssue, IssueType, IssueSeverity } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Agent that analyzes code for optimization opportunities
 */
export class OptimizationAgent extends BaseAgent {
  private aiConnector: AIConnector;

  /**
   * Create a new OptimizationAgent
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
    return 'optimization-agent';
  }

  /**
   * Analyze a file for optimization issues
   * @param filePath Path to the file
   * @param content Content of the file
   * @param repoDir Repository directory
   * @returns Promise that resolves to an array of code issues
   */
  async analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];

    // First, perform static analysis for common issues
    issues.push(...this.checkForLoopIssues(filePath, content));
    issues.push(...this.checkForMemoryIssues(filePath, content));
    issues.push(...this.checkForAsyncIssues(filePath, content));

    // Then, use AI to find more complex optimization issues
    try {
      const aiIssues = await this.getAIOptimizationSuggestions(filePath, content);
      issues.push(...aiIssues);
    } catch (error) {
      console.error(`Error getting AI optimization suggestions: ${error}`);
    }

    return issues;
  }

  /**
   * Get optimization suggestions from AI
   * @param filePath Path to the file
   * @param content Content of the file
   * @returns Promise that resolves to an array of code issues
   */
  private async getAIOptimizationSuggestions(
    filePath: string,
    content: string,
  ): Promise<CodeIssue[]> {
    const fileExtension = filePath.split('.').pop() || '';
    const language = this.getLanguageFromExtension(fileExtension);

    if (!language) {
      return [];
    }

    const prompt = `
You are a code optimization expert. Analyze the following ${language} code for performance issues and optimization opportunities.
Focus on algorithmic efficiency, memory usage, and performance bottlenecks.
Do not comment on style, security, or functionality unless it directly impacts performance.

CODE:
\`\`\`${language}
${content}
\`\`\`

Provide your analysis in the following JSON format:
{
  "issues": [
    {
      "title": "Brief title of the issue",
      "description": "Detailed explanation of the performance problem",
      "severity": "CRITICAL|ERROR|WARNING|INFO",
      "type": "OPTIMIZATION",
      "location": {
        "startLine": line_number,
        "endLine": line_number
      },
      "suggestedFix": "Code or explanation of how to fix the issue"
    }
  ]
}

Only include genuine optimization issues. If no issues are found, return an empty array for "issues".
`;

    try {
      const response = await this.aiConnector.generateResponse(prompt);
      return this.parseAIResponse(response, filePath);
    } catch (error) {
      console.error(`Error generating AI response: ${error}`);
      return [];
    }
  }

  /**
   * Parse AI response into code issues
   * @param response AI response
   * @param filePath Path to the file
   * @returns Array of code issues
   */
  private parseAIResponse(response: string, filePath: string): CodeIssue[] {
    try {
      // Extract JSON from response (in case AI includes extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return [];
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);

      if (!jsonResponse.issues || !Array.isArray(jsonResponse.issues)) {
        return [];
      }

      return jsonResponse.issues.map((issue: any) => ({
        id: uuidv4(),
        title: issue.title,
        description: issue.description,
        severity: issue.severity as IssueSeverity,
        type: IssueType.OPTIMIZATION,
        location: {
          filePath,
          startLine: issue.location?.startLine || 1,
          endLine: issue.location?.endLine || 1,
        },
        suggestedFix: issue.suggestedFix || '',
        agent: this.name,
      }));
    } catch (error) {
      console.error(`Error parsing AI response: ${error}`);
      return [];
    }
  }

  /**
   * Get language from file extension
   * @param extension File extension
   * @returns Language name or null if unknown
   */
  private getLanguageFromExtension(extension: string): string | null {
    const extensionMap: Record<string, string> = {
      js: 'JavaScript',
      ts: 'TypeScript',
      jsx: 'JavaScript React',
      tsx: 'TypeScript React',
      py: 'Python',
      java: 'Java',
      c: 'C',
      cpp: 'C++',
      cs: 'C#',
      go: 'Go',
      rb: 'Ruby',
      php: 'PHP',
      swift: 'Swift',
      kt: 'Kotlin',
      rs: 'Rust',
    };

    return extensionMap[extension.toLowerCase()] || null;
  }

  /**
   * Check for loop-related performance issues
   * @param filePath Path to the file
   * @param content Content of the file
   * @returns Array of code issues
   */
  private checkForLoopIssues(filePath: string, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Check for nested loops (potential O(n²) complexity)
    let inLoop = false;
    let loopStartLine = -1;
    let nestedLoopStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for loop start
      if (line.match(/\b(for|while)\b/) && line.includes('(') && !line.includes('//')) {
        if (inLoop) {
          // Found a nested loop
          nestedLoopStartLine = i + 1;
        } else {
          inLoop = true;
          loopStartLine = i + 1;
        }
      }

      // Check for loop end
      if (line === '}' && inLoop) {
        if (nestedLoopStartLine !== -1) {
          // End of nested loop
          issues.push({
            id: uuidv4(),
            title: 'Nested loop detected',
            description:
              'Nested loops can lead to O(n²) time complexity, which may cause performance issues for large datasets.',
            severity: IssueSeverity.WARNING,
            type: IssueType.OPTIMIZATION,
            location: {
              filePath,
              startLine: loopStartLine,
              endLine: i + 1,
            },
            suggestedFix:
              'Consider refactoring to avoid nested loops or use more efficient data structures like Maps or Sets.',
            agent: this.name,
          });

          nestedLoopStartLine = -1;
        } else {
          // End of outer loop
          inLoop = false;
          loopStartLine = -1;
        }
      }

      // Check for array.length in loop condition
      if (inLoop && line.includes('.length') && line.includes('for (')) {
        issues.push({
          id: uuidv4(),
          title: 'Array length in loop condition',
          description:
            'Accessing array.length in each iteration can be inefficient for large arrays.',
          severity: IssueSeverity.INFO,
          type: IssueType.OPTIMIZATION,
          location: {
            filePath,
            startLine: i + 1,
            endLine: i + 1,
          },
          suggestedFix:
            'Cache the array length before the loop: const len = array.length; for (let i = 0; i < len; i++)',
          agent: this.name,
        });
      }
    }

    return issues;
  }

  /**
   * Check for memory-related performance issues
   * @param filePath Path to the file
   * @param content Content of the file
   * @returns Array of code issues
   */
  private checkForMemoryIssues(filePath: string, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Check for large object literals
    let objectLiteralStart = -1;
    let objectLiteralLines = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for object literal start
      if (line.includes('{') && !line.includes('//') && !line.includes('/*')) {
        if (objectLiteralStart === -1) {
          objectLiteralStart = i + 1;
          objectLiteralLines = 1;
        } else {
          objectLiteralLines++;
        }
      }

      // Check for object literal end
      if (line.includes('}') && objectLiteralStart !== -1) {
        if (objectLiteralLines > 50) {
          issues.push({
            id: uuidv4(),
            title: 'Large object literal',
            description: `Large object literals (${objectLiteralLines} lines) can consume significant memory and impact performance.`,
            severity: IssueSeverity.WARNING,
            type: IssueType.OPTIMIZATION,
            location: {
              filePath,
              startLine: objectLiteralStart,
              endLine: i + 1,
            },
            suggestedFix:
              'Consider breaking this into smaller objects or loading data dynamically.',
            agent: this.name,
          });
        }

        objectLiteralStart = -1;
        objectLiteralLines = 0;
      }

      // Check for memory leaks in event listeners
      if (line.includes('addEventListener') && !content.includes('removeEventListener')) {
        issues.push({
          id: uuidv4(),
          title: 'Potential memory leak',
          description: 'Event listener is added but never removed, which can cause memory leaks.',
          severity: IssueSeverity.ERROR,
          type: IssueType.OPTIMIZATION,
          location: {
            filePath,
            startLine: i + 1,
            endLine: i + 1,
          },
          suggestedFix:
            'Make sure to remove event listeners when they are no longer needed using removeEventListener.',
          agent: this.name,
        });
      }
    }

    return issues;
  }

  /**
   * Check for async-related performance issues
   * @param filePath Path to the file
   * @param content Content of the file
   * @returns Array of code issues
   */
  private checkForAsyncIssues(filePath: string, content: string): CodeIssue[] {
    const issues: CodeIssue[] = [];
    const lines = content.split('\n');

    // Check for sequential async operations that could be parallelized
    const asyncOperations: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for await keyword
      if (line.includes('await ') && !line.includes('//')) {
        asyncOperations.push(i + 1);
      }
    }

    // Check for sequential awaits
    for (let i = 0; i < asyncOperations.length - 1; i++) {
      if (asyncOperations[i + 1] - asyncOperations[i] === 1) {
        issues.push({
          id: uuidv4(),
          title: 'Sequential async operations',
          description: 'Multiple sequential await operations could potentially be parallelized.',
          severity: IssueSeverity.INFO,
          type: IssueType.OPTIMIZATION,
          location: {
            filePath,
            startLine: asyncOperations[i],
            endLine: asyncOperations[i + 1],
          },
          suggestedFix:
            "Consider using Promise.all() to run these operations in parallel if they don't depend on each other.",
          agent: this.name,
        });

        // Skip the next one since we've already reported it
        i++;
      }
    }

    return issues;
  }
}
