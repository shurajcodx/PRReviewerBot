import { CodeIssue, IssueType, IssueSeverity } from '@pr-reviewer-bot/agents';
import { OutputHandlerFactory } from '../OutputHandlerFactory';

async function main() {
  // Sample code issues
  const issues: CodeIssue[] = [
    {
      title: 'Potential security vulnerability',
      description: 'Using eval() can lead to code injection attacks.',
      severity: IssueSeverity.CRITICAL,
      type: IssueType.SECURITY,
      location: {
        filePath: 'src/utils/parser.js',
        startLine: 15,
        endLine: 15
      },
      suggestedFix: 'Consider using a safer alternative like JSON.parse() or a dedicated parser library.',
      agent: 'security-agent'
    },
    {
      title: 'Unused variable',
      description: 'The variable "result" is declared but never used.',
      severity: IssueSeverity.WARNING,
      type: IssueType.STYLE,
      location: {
        filePath: 'src/components/UserProfile.tsx',
        startLine: 42,
        endLine: 42
      },
      suggestedFix: 'Remove the unused variable or use it.',
      agent: 'style-agent'
    },
    {
      title: 'Inefficient algorithm',
      description: 'This function has O(n²) complexity which could be optimized to O(n log n).',
      severity: IssueSeverity.ERROR,
      type: IssueType.OPTIMIZATION,
      location: {
        filePath: 'src/utils/sorter.js',
        startLine: 23,
        endLine: 35
      },
      suggestedFix: 'Consider using a more efficient sorting algorithm like quicksort or mergesort.',
      agent: 'ai-agent'
    },
    {
      title: 'Potential null reference',
      description: 'This property access might cause a null reference exception.',
      severity: IssueSeverity.ERROR,
      type: IssueType.BUG,
      location: {
        filePath: 'src/services/api.ts',
        startLine: 78,
        endLine: 78
      },
      suggestedFix: 'Add a null check before accessing the property.',
      agent: 'ai-agent'
    }
  ];

  // Example 1: Using FileOutputHandler
  console.log('Example 1: Using FileOutputHandler');
  const fileOutputHandler = OutputHandlerFactory.createOutputHandler('file', {
    filePath: './review-results.md',
    groupByFile: true
  });
  
  await fileOutputHandler.handleOutput(issues);
  
  // Example 2: Using FileOutputHandler with different grouping
  console.log('\nExample 2: Using FileOutputHandler with severity grouping');
  const fileOutputHandler2 = OutputHandlerFactory.createOutputHandler('file', {
    filePath: './review-results-by-severity.md',
    groupBySeverity: true
  });
  
  await fileOutputHandler2.handleOutput(issues);
  
  // Example 3: Using GitHubPROutputHandler
  // Note: This requires valid GitHub credentials and PR information
  console.log('\nExample 3: Using GitHubPROutputHandler');
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const prNumber = parseInt(process.env.PR_NUMBER || '0', 10);
    const repoUrl = process.env.REPO_URL;
    
    if (!githubToken || !prNumber || !repoUrl) {
      console.log('Skipping GitHub PR example: Missing required environment variables');
      console.log('Required: GITHUB_TOKEN, PR_NUMBER, REPO_URL');
    } else {
      const githubOutputHandler = OutputHandlerFactory.createOutputHandler('github-pr', {
        gitToken: githubToken,
        prNumber: prNumber,
        repoUrl: repoUrl
      });
      
      await githubOutputHandler.handleOutput(issues);
    }
  } catch (error) {
    console.error('Error in GitHub PR example:', error);
  }
}

// Run the example
main().catch(error => {
  console.error('Error running example:', error);
}); 