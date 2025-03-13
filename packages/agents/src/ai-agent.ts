import OpenAI from 'openai';
import path from 'path';
import { Agent } from './index';
import { CodeIssue } from './types';

export class AIAgent implements Agent {
  name = 'AI Analysis';
  private openai: OpenAI;
  
  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  
  async analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]> {
    try {
      const filename = path.basename(filePath);
      const language = this.detectLanguage(filename);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert code reviewer specialized in ${language}. Analyze the code for:
            1. Potential bugs
            2. Security vulnerabilities
            3. Performance issues
            4. Best practices
            
            For each issue found, provide:
            - Type (bug, security, performance, best-practice)
            - Message (clear description of the issue)
            - Severity (low, medium, high)
            - Line number if you can determine it
            
            Format your response as a JSON array of issues. Example:
            {
              "issues": [
                {
                  "type": "security",
                  "message": "SQL injection vulnerability in query construction",
                  "line": 42,
                  "severity": "high"
                }
              ]
            }
            
            If no issues are found, return an empty array: { "issues": [] }`
          },
          {
            role: "user",
            content: `Review this ${language} code:\n\n${content}`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      const content_response = response.choices[0].message.content;
      if (!content_response) {
        return [];
      }
      
      try {
        const result = JSON.parse(content_response);
        return Array.isArray(result.issues) ? result.issues : [];
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return [{
          type: 'best-practice',
          message: 'Error parsing AI analysis. Please check the code manually.',
          severity: 'low'
        }];
      }
    } catch (error: any) {
      console.error('Error analyzing code with AI:', error);
      return [{
        type: 'best-practice',
        message: `Error analyzing code with AI: ${error.message}`,
        severity: 'low'
      }];
    }
  }
  
  private detectLanguage(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.js':
        return 'JavaScript';
      case '.jsx':
        return 'React JavaScript';
      case '.ts':
        return 'TypeScript';
      case '.tsx':
        return 'React TypeScript';
      case '.py':
        return 'Python';
      case '.java':
        return 'Java';
      case '.rb':
        return 'Ruby';
      case '.go':
        return 'Go';
      case '.php':
        return 'PHP';
      case '.cs':
        return 'C#';
      case '.cpp':
      case '.cc':
      case '.cxx':
        return 'C++';
      case '.c':
        return 'C';
      case '.html':
        return 'HTML';
      case '.css':
        return 'CSS';
      case '.scss':
        return 'SCSS';
      case '.json':
        return 'JSON';
      case '.md':
        return 'Markdown';
      case '.sql':
        return 'SQL';
      case '.sh':
        return 'Shell';
      default:
        return 'code';
    }
  }
} 