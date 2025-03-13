import { GitProvider } from '../types';
import GitHubProvider from './github';

class GitProviderFactory {
  static createProvider(repoUrl: string, token: string): GitProvider {
    if (repoUrl.includes('github.com')) {
      return new GitHubProvider(token);
    }
    
    // Add more providers as needed
    // if (repoUrl.includes('gitlab.com')) {
    //   return new GitLabProvider(token);
    // }
    
    throw new Error(`Unsupported git provider for URL: ${repoUrl}`);
  }
}

export {
  GitProviderFactory,
  GitHubProvider
}