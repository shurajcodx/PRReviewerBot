export interface CodeIssue {
  type: 'bug' | 'security' | 'performance' | 'best-practice' | 'style';
  message: string;
  line?: number;
  column?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description: string;
  branch: string;
  head: {
    sha: string;
    ref: string;
  };
  files: FileChange[];
}

export interface FileChange {
  filename: string;
  status: string;
  patch?: string;
  content: string;
}

export interface GitProvider {
  getPullRequest(repoUrl: string, branch: string): Promise<PullRequest>;
  createReviewComment(repoUrl: string, prId: string, comment: string, file: string, line: number): Promise<void>;
} 