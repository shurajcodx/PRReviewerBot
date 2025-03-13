import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { Agent } from '.';
import { CodeIssue } from './types';

export class StyleAgent implements Agent {
  name = 'Style Checker';
  
  async analyze(filePath: string, content: string, repoDir: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    const ext = path.extname(filePath).toLowerCase();
    
    // Check if we should lint this file
    if (!['.js', '.jsx', '.ts', '.tsx', '.css', '.scss', '.html'].includes(ext)) {
      return issues;
    }
    
    try {
      // Check for ESLint config
      const hasEslint = fs.existsSync(path.join(repoDir, '.eslintrc')) || 
                        fs.existsSync(path.join(repoDir, '.eslintrc.js')) ||
                        fs.existsSync(path.join(repoDir, '.eslintrc.json'));
      
      if (hasEslint && ['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        try {
          // Run ESLint
          const relativePath = path.relative(repoDir, filePath);
          const result = execSync(`cd ${repoDir} && npx eslint --no-eslintrc --format json ${relativePath}`, 
                                { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
          
          const eslintResults = JSON.parse(result);
          
          for (const file of eslintResults) {
            for (const message of file.messages) {
              issues.push({
                type: 'style',
                message: `ESLint: ${message.message}`,
                line: message.line,
                column: message.column,
                severity: this.mapEslintSeverity(message.severity)
              });
            }
          }
        } catch (error: any) {
          // ESLint often exits with code 1 when it finds issues
          if (error.stdout) {
            try {
              const eslintResults = JSON.parse(error.stdout);
              
              for (const file of eslintResults) {
                for (const message of file.messages) {
                  issues.push({
                    type: 'style',
                    message: `ESLint: ${message.message}`,
                    line: message.line,
                    column: message.column,
                    severity: this.mapEslintSeverity(message.severity)
                  });
                }
              }
            } catch (parseError) {
              issues.push({
                type: 'style',
                message: `Error parsing ESLint output: ${error.message}`,
                severity: 'low'
              });
            }
          } else {
            issues.push({
              type: 'style',
              message: `ESLint error: ${error.message}`,
              severity: 'low'
            });
          }
        }
      }
      
      // Check for Prettier config
      const hasPrettier = fs.existsSync(path.join(repoDir, '.prettierrc')) || 
                          fs.existsSync(path.join(repoDir, '.prettierrc.js')) ||
                          fs.existsSync(path.join(repoDir, '.prettierrc.json'));
      
      if (hasPrettier) {
        try {
          // Run Prettier check
          const relativePath = path.relative(repoDir, filePath);
          execSync(`cd ${repoDir} && npx prettier --check ${relativePath}`, 
                  { encoding: 'utf8', stdio: 'ignore' });
        } catch (error: any) {
          issues.push({
            type: 'style',
            message: 'Prettier: File is not formatted according to project standards',
            severity: 'low'
          });
        }
      }
    } catch (error: any) {
      issues.push({
        type: 'style',
        message: `Style check error: ${error.message}`,
        severity: 'low'
      });
    }
    
    return issues;
  }
  
  private mapEslintSeverity(eslintSeverity: number): 'low' | 'medium' | 'high' {
    switch (eslintSeverity) {
      case 0: // warn
        return 'low';
      case 1: // warning
        return 'medium';
      case 2: // error
        return 'high';
      default:
        return 'medium';
    }
  }
} 