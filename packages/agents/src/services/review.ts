import fs from 'fs';
import path from 'path';
import { GitProvider, CodeIssue } from '../types';
import GitService from './git';
import { Agent } from '..';

class ReviewService {
  private gitProvider: GitProvider;
  private agents: Agent[];
  private outputDir: string;
  
  constructor(gitProvider: GitProvider, agents: Agent[], outputDir: string) {
    this.gitProvider = gitProvider;
    this.agents = agents;
    this.outputDir = outputDir;
  }
  
  async reviewPullRequest(repoUrl: string, branch: string): Promise<void> {
    try {
      console.log('Finding PR for branch...');
      const pr = await this.gitProvider.getPullRequest(repoUrl, branch);
      
      console.log(`Found PR #${pr.number}: ${pr.title}`);
      
      // Extract token from provider (this is a bit of a hack, would be better to refactor)
      const token = (this.gitProvider as any).octokit?.auth || '';
      
      // Clone the repository
      await GitService.cloneRepository(repoUrl, token, this.outputDir, branch);
      
      console.log(`Reviewing ${pr.files.length} files...`);
      
      // Review each file
      for (const file of pr.files) {
        if (file.status === 'removed') continue;
        
        const filePath = path.join(this.outputDir, file.filename);
        
        if (!fs.existsSync(filePath)) {
          console.log(`Skipping ${file.filename} - file not found`);
          continue;
        }
        
        console.log(`Analyzing ${file.filename}...`);
        
        // Run all agents on the file
        const allIssues: CodeIssue[] = [];
        
        for (const agent of this.agents) {
          console.log(`Running ${agent.name} on ${file.filename}...`);
          const issues = await agent.analyze(filePath, file.content, this.outputDir);
          allIssues.push(...issues);
        }
        
        if (allIssues.length > 0) {
          // Create a comment on the PR
          await this.gitProvider.createReviewComment(
            repoUrl,
            pr.id,
            this.formatReviewComment(allIssues),
            file.filename,
            this.getRelevantLine(allIssues)
          );
          
          console.log(`Added review comments for ${file.filename}`);
        } else {
          console.log(`No issues found in ${file.filename}`);
        }
      }
      
      // Clean up
      fs.rmSync(this.outputDir, { recursive: true, force: true });
    } catch (error) {
      console.error('Error during PR review:', error);
      throw error;
    }
  }
  
  private formatReviewComment(issues: CodeIssue[]): string {
    if (issues.length === 0) {
      return 'No issues found.';
    }
    
    // Group issues by type
    const groupedIssues: Record<string, CodeIssue[]> = {};
    
    for (const issue of issues) {
      if (!groupedIssues[issue.type]) {
        groupedIssues[issue.type] = [];
      }
      groupedIssues[issue.type].push(issue);
    }
    
    let comment = '## PR Review Bot Findings\n\n';
    
    // Add issues by type
    for (const [type, typeIssues] of Object.entries(groupedIssues)) {
      comment += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Issues\n\n`;
      
      for (const issue of typeIssues) {
        const location = issue.line ? ` (line ${issue.line})` : '';
        const severity = `[${issue.severity.toUpperCase()}]`;
        comment += `- ${severity}${location}: ${issue.message}\n`;
      }
      
      comment += '\n';
    }
    
    comment += '---\n*This review was generated automatically by PR Review Bot*';
    
    return comment;
  }
  
  private getRelevantLine(issues: CodeIssue[]): number {
    // Find the first issue with a line number
    for (const issue of issues) {
      if (issue.line) {
        return issue.line;
      }
    }
    
    // Default to line 1 if no line numbers are found
    return 1;
  }
} 

export default ReviewService;
