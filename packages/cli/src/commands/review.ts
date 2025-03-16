import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { GitService, RepoService } from '@pr-reviewer-bot/core';
import {
  StyleAgent,
  SecurityAgent,
  BugDetectionAgent,
  OptimizationAgent,
} from '@pr-reviewer-bot/agents';
import { AIConnectorFactory } from '@pr-reviewer-bot/ai-connectors';
import { OutputHandlerFactory } from '@pr-reviewer-bot/output';

export function reviewCommand(): Command {
  const command = new Command('review');

  command
    .description('Review a pull request')
    .requiredOption('-u, --url <url>', 'Git repository URL')
    .requiredOption('-t, --token <token>', 'Git access token')
    .requiredOption('-b, --branch <branch>', 'Branch name to review')
    .option('-o, --output-dir <directory>', 'Output directory for cloned repo', './temp-repo')
    .option('-a, --ai-key <key>', 'AI API key (or set AI_API_KEY env var)')
    .option('-m, --ai-model <model>', 'AI model to use (claude, openai, ollama)', 'claude')
    .option('--ai-options <json>', 'Additional options for the AI model as JSON string')
    .option('-f, --output-format <format>', 'Output format (file, pr-comment)', 'file')
    .option(
      '--output-file <file>',
      'Output file path (when using file format)',
      './review-results.md',
    )
    .option(
      '--agents <agents>',
      'Comma-separated list of agents to use (all, security, style, bug, optimization)',
      'all',
    )
    .action(async options => {
      try {
        // Get AI API key
        const aiApiKey = options.aiKey || process.env.AI_API_KEY || '';

        // Check if API key is required for the selected model
        if (!aiApiKey && options.aiModel !== 'ollama') {
          console.error(
            chalk.red(
              'AI API key is required for commercial models. Provide it with --ai-key or set AI_API_KEY env var.',
            ),
          );
          process.exit(1);
        }

        // Parse AI options
        let aiOptions: Record<string, string> = {};
        if (options.aiOptions) {
          try {
            aiOptions = JSON.parse(options.aiOptions);
          } catch (error) {
            console.error(chalk.red('Invalid AI options JSON format.'));
            process.exit(1);
          }
        }

        // For Ollama, check environment variables for options
        if (options.aiModel === 'ollama') {
          if (!aiOptions.model && process.env.OLLAMA_MODEL) {
            aiOptions.model = process.env.OLLAMA_MODEL;
          }
          if (!aiOptions.baseUrl && process.env.OLLAMA_BASE_URL) {
            aiOptions.baseUrl = process.env.OLLAMA_BASE_URL;
          }
        }

        // Parse agents option
        const agentsList = options.agents
          .toLowerCase()
          .split(',')
          .map((a: string) => a.trim());
        const useAllAgents = agentsList.includes('all');

        // Initialize spinner
        const spinner = ora('Initializing PR review').start();

        try {
          // Create AI connector
          spinner.text = 'Creating AI connector';
          const aiConnector = AIConnectorFactory.createConnector(
            options.aiModel,
            aiApiKey,
            aiOptions,
          );

          // Initialize agents
          spinner.text = 'Initializing agents';
          const agents = [];

          if (useAllAgents || agentsList.includes('security')) {
            agents.push(new SecurityAgent(aiConnector));
          }

          if (useAllAgents || agentsList.includes('style')) {
            agents.push(new StyleAgent());
          }

          if (useAllAgents || agentsList.includes('bug')) {
            agents.push(new BugDetectionAgent(aiConnector));
          }

          if (useAllAgents || agentsList.includes('optimization')) {
            agents.push(new OptimizationAgent(aiConnector));
          }

          // Create git service
          spinner.text = 'Initializing Git service';
          const gitService = new GitService(options.token);

          // Create repo service
          spinner.text = 'Initializing repository service';
          const repoService = new RepoService(gitService, options.outputDir);

          // Create output handler
          spinner.text = 'Initializing output handler';
          const outputHandler = OutputHandlerFactory.createOutputHandler(options.outputFormat, {
            filePath: options.outputFile,
            gitToken: options.token,
            repoUrl: options.url,
          });

          // Clone repository
          spinner.text = 'Cloning repository';
          await repoService.cloneRepository(options.url);

          // Checkout branch
          spinner.text = 'Checking out branch';
          await repoService.checkoutBranch(options.branch);

          // Get changed files
          spinner.text = 'Getting changed files';
          const changedFiles = await repoService.getChangedFiles();

          // Run analysis with each agent
          spinner.text = 'Analyzing code';
          const allIssues = [];

          for (const agent of agents) {
            spinner.text = `Running ${agent.name} analysis`;

            for (const file of changedFiles) {
              const fileContent = await repoService.getFileContent(file);
              const issues = await agent.analyze(file, fileContent, options.outputDir);
              allIssues.push(...issues);
            }
          }

          // Output results
          spinner.text = 'Generating output';
          await outputHandler.handleOutput(allIssues);

          // Clean up
          spinner.text = 'Cleaning up';
          await repoService.cleanup();

          spinner.succeed(chalk.green('PR review completed successfully!'));
          console.log(`Found ${allIssues.length} issues.`);

          if (options.outputFormat === 'file') {
            console.log(`Results saved to ${options.outputFile}`);
          }
        } catch (error) {
          spinner.fail(chalk.red('Error during PR review'));
          throw error;
        }
      } catch (error) {
        console.error(chalk.red('Error during PR review:'), error);
        process.exit(1);
      }
    });

  return command;
}
