import path from 'path';
import fs from 'fs-extra';
import { GitService } from './GitService';

/**
 * Service for repository operations
 */
export class RepoService {
  private gitService: GitService;
  private repoDir: string;
  private isCloned: boolean = false;

  /**
   * Create a new RepoService
   * @param gitService Git service
   * @param repoDir Repository directory
   */
  constructor(gitService: GitService, repoDir: string) {
    this.gitService = gitService;
    this.repoDir = repoDir;
  }

  /**
   * Clone a repository
   * @param repoUrl Repository URL
   */
  async cloneRepository(repoUrl: string): Promise<void> {
    // Clean up any existing directory
    await this.cleanup();
    
    // Clone the repository
    await this.gitService.cloneRepository(repoUrl, this.repoDir);
    this.isCloned = true;
  }

  /**
   * Checkout a branch
   * @param branchName Branch name
   */
  async checkoutBranch(branchName: string): Promise<void> {
    if (!this.isCloned) {
      throw new Error('Repository not cloned yet');
    }
    
    await this.gitService.checkoutBranch(branchName);
  }

  /**
   * Get changed files
   * @returns Array of changed file paths
   */
  async getChangedFiles(): Promise<string[]> {
    if (!this.isCloned) {
      throw new Error('Repository not cloned yet');
    }
    
    const changedFiles = await this.gitService.getChangedFiles();
    
    // Convert to absolute paths
    return changedFiles.map(file => path.join(this.repoDir, file));
  }

  /**
   * Get file content
   * @param filePath File path
   * @returns File content
   */
  async getFileContent(filePath: string): Promise<string> {
    if (!this.isCloned) {
      throw new Error('Repository not cloned yet');
    }
    
    return await this.gitService.getFileContent(filePath);
  }

  /**
   * Clean up the repository directory
   */
  async cleanup(): Promise<void> {
    if (await fs.pathExists(this.repoDir)) {
      await fs.remove(this.repoDir);
    }
    this.isCloned = false;
  }
} 