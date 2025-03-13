import fs from 'fs';
import { execSync } from 'child_process';

class GitService {
  static async cloneRepository(url: string, token: string, directory: string, branch: string): Promise<void> {
    // Clean up if directory exists
    if (fs.existsSync(directory)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
    
    // Create directory
    fs.mkdirSync(directory, { recursive: true });
    
    // Add token to URL
    const authUrl = url.replace('https://', `https://x-access-token:${token}@`);
    
    // Clone repository
    console.log(`Cloning repository ${url} (branch: ${branch})...`);
    execSync(`git clone --branch ${branch} ${authUrl} ${directory}`, { stdio: 'ignore' });
    
    console.log('Repository cloned successfully');
  }
} 

export default GitService;
