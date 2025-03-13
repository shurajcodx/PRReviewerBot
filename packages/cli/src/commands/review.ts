import { Command } from 'commander';
import { AIAgent, StyleAgent, ReviewService, GitProviderFactory } from '@pr-reviewer-bot/agents';

export function reviewCommand(): Command {
  const command = new Command('review');
  
  command
    .description('Review a pull request')
    .requiredOption('-u, --url <url>', 'Git repository URL')
    .requiredOption('-t, --token <token>', 'Git access token')
    .requiredOption('-b, --branch <branch>', 'Branch name to review')
    .option('-o, --output <directory>', 'Output directory for cloned repo', './temp-repo')
    .option('-a, --ai-key <key>', 'OpenAI API key (or set OPENAI_API_KEY env var)')
    .action(async (options) => {
      try {
        // Get OpenAI API key
        const openaiApiKey = options.aiKey || process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
          console.error('OpenAI API key is required. Provide it with --ai-key or set OPENAI_API_KEY env var.');
          process.exit(1);
        }
        
        // Initialize agents
        const aiAgent = new AIAgent(openaiApiKey);
        const styleAgent = new StyleAgent();
        
        // Create git provider
        const gitProvider = GitProviderFactory.createProvider(options.url, options.token);
        
        // Create review service
        const reviewService = new ReviewService(
          gitProvider,
          [aiAgent, styleAgent],
          options.output
        );
        
        // Run the review
        await reviewService.reviewPullRequest(options.url, options.branch);
        
        console.log('PR review completed successfully!');
      } catch (error) {
        console.error('Error during PR review:', error);
        process.exit(1);
      }
    });

  return command;
} 