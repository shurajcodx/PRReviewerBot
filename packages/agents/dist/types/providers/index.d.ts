import { GitProvider } from '../types';
import GitHubProvider from './github';
declare class GitProviderFactory {
    static createProvider(repoUrl: string, token: string): GitProvider;
}
export { GitProviderFactory, GitHubProvider };
//# sourceMappingURL=index.d.ts.map