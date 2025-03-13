import { Octokit } from 'octokit';
import { GitProvider, PullRequest, FileChange } from '../types';

class GitHubProvider implements GitProvider {
  private octokit: Octokit;
  
  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }
  
  private parseRepoUrl(url: string): { owner: string; repo: string } {
    // Handle different URL formats
    const githubRegex = /github\.com\/([^\/]+)\/([^\/\.]+)(\.git)?$/;
    const match = url.match(githubRegex);
    
    if (!match) {
      throw new Error(`Could not parse repository URL: ${url}`);
    }
    
    return {
      owner: match[1],
      repo: match[2]
    };
  }
  
  async getPullRequest(repoUrl: string, branch: string): Promise<PullRequest> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    
    const { data: prs } = await this.octokit.rest.pulls.list({
      owner,
      repo,
      head: `${owner}:${branch}`,
      state: 'open'
    });
    
    if (prs.length === 0) {
      throw new Error(`No open PR found for branch ${branch}`);
    }
    
    const pr = prs[0];
    const files = await this.getPRFiles(owner, repo, pr.number);
    
    return {
      id: pr.number.toString(),
      number: pr.number,
      title: pr.title,
      description: pr.body || '',
      branch,
      head: {
        sha: pr.head.sha,
        ref: pr.head.ref
      },
      files
    };
  }
  
  private async getPRFiles(owner: string, repo: string, prNumber: number): Promise<FileChange[]> {
    const { data: files } = await this.octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber
    });
    
    return Promise.all(files.map(async (file: { filename: string; status: any; patch: any; }) => ({
      filename: file.filename,
      status: file.status,
      patch: file.patch || '',
      content: await this.getFileContent(owner, repo, file.filename, prNumber)
    })));
  }
  
  private async getFileContent(owner: string, repo: string, path: string, prNumber: number): Promise<string> {
    try {
      // Try to get content from the PR
      const { data } = await this.octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
        path
      });
      
      // If file exists in PR, get its content
      const fileData = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: `pull/${prNumber}/head`
      });
      
      if ('content' in fileData.data) {
        return Buffer.from(fileData.data.content, 'base64').toString();
      }
      
      throw new Error('File content not found');
    } catch (error) {
      console.error(`Error fetching file content: ${path}`, error);
      return '';
    }
  }
  
  async createReviewComment(
    repoUrl: string,
    prId: string,
    comment: string,
    file: string,
    line: number
  ): Promise<void> {
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    const prNumber = parseInt(prId, 10);
    
    // Get the PR to find the latest commit SHA
    const { data: pr } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber
    });
    
    // Create a review
    await this.octokit.rest.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      commit_id: pr.head.sha,
      event: 'COMMENT',
      comments: [
        {
          path: file,
          position: line, // This is a simplification
          body: comment
        }
      ]
    });
  }
} 

export default GitHubProvider;
