import { GitProvider, PullRequest } from '../types';
declare class GitHubProvider implements GitProvider {
    private octokit;
    constructor(token: string);
    private parseRepoUrl;
    getPullRequest(repoUrl: string, branch: string): Promise<PullRequest>;
    private getPRFiles;
    private getFileContent;
    createReviewComment(repoUrl: string, prId: string, comment: string, file: string, line: number): Promise<void>;
}
export default GitHubProvider;
//# sourceMappingURL=github.d.ts.map