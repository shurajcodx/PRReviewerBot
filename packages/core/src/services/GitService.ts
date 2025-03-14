import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs-extra';
import path from 'path';

/**
 * Service for Git operations
 */
export class GitService {
  private git: SimpleGit;
  private token: string;

  /**
   * Create a new GitService
   * @param token Git access token
   */
  constructor(token: string) {
    this.token = token;
    this.git = simpleGit();
  }

  /**
   * Clone a repository
   * @param repoUrl Repository URL
   * @param targetDir Target directory
   */
  async cloneRepository(repoUrl: string, targetDir: string): Promise<void> {
    // Ensure the target directory exists
    await fs.ensureDir(targetDir);
    
    // Add token to URL if needed
    const authUrl = this.addAuthToUrl(repoUrl);
    
    // Clone the repository
    await this.git.clone(authUrl, targetDir);
    
    // Initialize git in the target directory
    this.git = simpleGit(targetDir);
  }

  /**
   * Checkout a branch
   * @param branchName Branch name
   */
  async checkoutBranch(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
  }

  /**
   * Get changed files compared to main branch
   * @returns Array of changed file paths
   */
  async getChangedFiles(): Promise<string[]> {
    // Get the default branch (main or master)
    const defaultBranch = await this.getDefaultBranch();
    
    // Get diff with default branch
    const diff = await this.git.diff([`${defaultBranch}...HEAD`, '--name-only']);
    
    // Split the result into lines and filter out empty lines
    return diff.split('\n').filter(line => line.trim() !== '');
  }

  /**
   * Get file content
   * @param filePath File path
   * @returns File content
   */
  async getFileContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  /**
   * Get the default branch (main or master)
   * @returns Default branch name
   */
  private async getDefaultBranch(): Promise<string> {
    try {
      // Try to get the default branch from remote
      const remotes = await this.git.remote(['show', 'origin']);
      const match = remotes?.match(/HEAD branch: ([^\n]+)/);

      if (match && match[1]) {
        return match[1];
      }
      
      // Fallback to checking if main or master exists
      const branches = await this.git.branch();
      if (branches.all.includes('main')) {
        return 'main';
      } else if (branches.all.includes('master')) {
        return 'master';
      }
      
      // Default to main if we can't determine
      return 'main';
    } catch (error) {
      console.warn(`Warning: Could not determine default branch: ${error}`);

      return 'main'; // Default fallback
    }
  }

  /**
   * Add authentication to a Git URL
   * @param url Git URL
   * @returns URL with authentication
   */
  private addAuthToUrl(url: string): string {
    try {
      // Only add auth for HTTPS URLs
      if (url.startsWith('https://')) {
        const urlObj = new URL(url);
        urlObj.username = 'x-access-token';
        urlObj.password = this.token;
        return urlObj.toString();
      }
      return url;
    } catch (error) {
      console.warn(`Warning: Could not add auth to URL: ${error}`);

      return url;
    }
  }
} 