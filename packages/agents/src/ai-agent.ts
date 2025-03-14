import { BaseAgent } from './BaseAgent';
import { CodeIssue, IssueType, IssueSeverity } from './types';
import { AIConnector } from '@pr-reviewer-bot/ai-connectors';
import path from 'path';

/**
 * Agent that uses AI to analyze code for general issues
 */
export class AIAgent extends BaseAgent {
  private aiConnector: AIConnector;
  
  /**
   * Create a new AIAgent
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
    return 'AI';
  }
  
  /**
   * Analyze a file for issues
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
    
    // Get the language of the file
    const language = this.getFileLanguage(filePath) || 'Unknown';
    
    // Get the relative path
    const relativePath = this.getRelativePath(filePath, repoDir);
    
    // Create the prompt
    const prompt = this.createPrompt(content, language, relativePath);
    
    // Send the prompt to the AI
    const response = await this.aiConnector.generateResponse(prompt);
    
    // Parse the response
    return this.parseResponse(response, filePath);
  }
  
  /**
   * Get the language of a file based on its extension
   * @param filePath File path
   * @returns Language name or null if unknown
   */
  private getFileLanguage(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript (React)',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript (React)',
      '.py': 'Python',
      '.rb': 'Ruby',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.cs': 'C#',
      '.go': 'Go',
      '.php': 'PHP',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.less': 'Less',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.md': 'Markdown',
      '.sh': 'Shell',
      '.bat': 'Batch',
      '.ps1': 'PowerShell',
      '.sql': 'SQL',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.rs': 'Rust',
      '.dart': 'Dart',
      '.lua': 'Lua',
      '.r': 'R',
      '.pl': 'Perl',
      '.ex': 'Elixir',
      '.exs': 'Elixir',
      '.erl': 'Erlang',
      '.hs': 'Haskell',
      '.fs': 'F#',
      '.fsx': 'F#',
      '.scala': 'Scala',
      '.clj': 'Clojure',
      '.groovy': 'Groovy',
      '.tf': 'Terraform',
      '.vue': 'Vue',
      '.svelte': 'Svelte'
    };
    
    return languageMap[ext] || null;
  }
  
  /**
   * Create a prompt for the AI
   * @param content File content
   * @param language File language
   * @param filePath File path
   * @returns Prompt
   */
  private createPrompt(content: string, language: string, filePath: string): string {
    return `
You are a code reviewer analyzing a file for potential issues. Please review the following ${language} code from the file ${filePath} and identify any issues related to:

1. Potential bugs
2. Security vulnerabilities
3. Performance issues
4. Code style issues
5. Best practices violations

For each issue, provide:
- A brief title
- A detailed description of the problem
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
    "severity": "warning",
    "type": "bug",
    "suggestedFix": "Code suggestion to fix the issue"
  }
]
\`\`\`

Here is the code to review:

\`\`\`${language}
${content}
\`\`\`

If no issues are found, return an empty array: []
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
            severity = IssueSeverity.INFO;
        }
        
        // Map type
        let type: IssueType;
        switch (issue.type?.toLowerCase()) {
          case 'security':
            type = IssueType.SECURITY;
            break;
          case 'style':
            type = IssueType.STYLE;
            break;
          case 'bug':
            type = IssueType.BUG;
            break;
          case 'optimization':
            type = IssueType.OPTIMIZATION;
            break;
          default:
            type = IssueType.OTHER;
        }
        
        return this.createIssue(
          issue.title,
          issue.description,
          type,
          severity,
          filePath,
          issue.lineStart,
          issue.lineEnd,
          issue.suggestedFix
        );
      });
    } catch (error) {
      console.warn(`Warning: Could not parse AI response: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
} 