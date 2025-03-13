import { GitProvider } from '../types';
import { Agent } from '..';
declare class ReviewService {
    private gitProvider;
    private agents;
    private outputDir;
    constructor(gitProvider: GitProvider, agents: Agent[], outputDir: string);
    reviewPullRequest(repoUrl: string, branch: string): Promise<void>;
    private formatReviewComment;
    private getRelevantLine;
}
export default ReviewService;
//# sourceMappingURL=review.d.ts.map