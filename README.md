# PR Reviewer Bot

An AI-powered code review assistant that automatically analyzes pull requests and provides feedback on code quality, potential bugs, security issues, and optimization opportunities.

## Features

- **Automated Code Reviews**: Analyzes code changes in pull requests
- **Multiple Analysis Types**: Detects security vulnerabilities, style issues, bugs, and optimization opportunities
- **AI-Powered Insights**: Uses AI models to provide intelligent code feedback
- **Flexible Output**: Generates reports as Markdown files or GitHub PR comments
- **Multiple AI Options**: Supports commercial APIs (OpenAI, Claude) and self-hosted models (Ollama)

## Project Structure

The project is organized as a monorepo with the following packages:

- **agents**: Code analysis agents that detect different types of issues
- **ai-connectors**: Connectors for various AI services (OpenAI, Claude, Ollama)
- **output**: Formatters for delivering review results (file output, GitHub PR comments)
- **core**: Core functionality and shared utilities
- **cli**: Command-line interface for running the bot

## Installation

```bash
# Clone the repository
git clone https://github.com/shurajcodx/PRReviewerBot.git
cd PRReviewerBot

# Install dependencies
make install

# Build the project
make build
```

## Development

### Code Style and Linting

The project uses ESLint and Prettier to maintain code quality and consistent style:

```bash
# Run linting
make lint

# Fix linting issues
make lint-fix

# Format code
make format

# Check code formatting
make format-check
```

## Setup

### Using Commercial AI Services

1. **Get API Keys**:

   - OpenAI: Sign up at [platform.openai.com](https://platform.openai.com)
   - Claude: Sign up at [anthropic.com](https://console.anthropic.com)

2. **Configure the Bot**:
   You can set environment variables when running the CLI:

   ```bash
   # For OpenAI
   AI_API_KEY=your-openai-api-key prreviewbot review --ai-model openai [options]

   # For Claude (default)
   AI_API_KEY=your-claude-api-key prreviewbot review [options]
   ```

   Alternatively, you can create a `.env` file in the root directory:

   ```
   # For OpenAI
   AI_API_KEY=your-openai-api-key
   AI_MODEL=openai

   # For Claude
   # AI_API_KEY=your-claude-api-key
   # AI_MODEL=claude
   ```

### Using Self-Hosted Ollama (Free)

1. **Install Ollama**:

   - Download and install from [ollama.ai](https://ollama.ai)
   - Start the Ollama server

2. **Pull a Model**:

   ```bash
   # Pull a general-purpose model
   ollama pull llama2

   # Or pull a code-specific model
   ollama pull codellama
   ```

3. **Configure the Bot**:

   ```bash
   # Use Ollama with a specific model
   prreviewbot review --ai-model ollama --ai-options '{"model":"codellama","baseUrl":"http://localhost:11434"}' [options]
   ```

   Alternatively, add to your `.env` file:

   ```
   AI_MODEL=ollama
   OLLAMA_MODEL=codellama
   OLLAMA_BASE_URL=http://localhost:11434
   ```

### GitHub Integration (Optional)

To post review comments directly on GitHub PRs:

1. **Create a GitHub Personal Access Token**:

   - Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Create a token with `repo` scope

2. **Add to Environment Variables**:

   ```bash
   prreviewbot review --url https://github.com/owner/repo --branch branch-name --token your-github-token
   ```

   Or add to your `.env` file:

   ```
   GIT_TOKEN=your-github-token
   ```

## Usage

### Basic Usage

To use the PR Reviewer Bot, run the CLI directly:

```bash
# Review a branch in a repository
prreviewbot review --url https://github.com/owner/repo --branch feature-branch

# Review with specific AI model
prreviewbot review --url https://github.com/owner/repo --branch feature-branch --ai-model openai --ai-key your-api-key

# Review with Ollama (free, self-hosted)
prreviewbot review --url https://github.com/owner/repo --branch feature-branch --ai-model ollama

# Output results to a specific file
prreviewbot review --url https://github.com/owner/repo --branch feature-branch --output-format file --output-file ./my-review.md
```

### Command Options

The CLI supports the following options:

```
Options:
  -u, --url <url>               Git repository URL
  -t, --token <token>           Git access token
  -b, --branch <branch>         Branch name to review
  -o, --output-dir <directory>  Output directory for cloned repo (default: "./temp-repo")
  -a, --ai-key <key>            AI API key (or set AI_API_KEY env var)
  -m, --ai-model <model>        AI model to use (claude, openai, ollama) (default: "claude")
  --ai-options <json>           Additional options for the AI model as JSON string
  -f, --output-format <format>  Output format (file, pr-comment) (default: "file")
  --output-file <file>          Output file path (when using file format) (default: "./review-results.md")
  --agents <agents>             Comma-separated list of agents to use (all, security, style, bug, optimization) (default: "all")
  -h, --help                    display help for command
```

## Examples

### Example 1: Review a Branch

```bash
# Review a branch using Claude
AI_API_KEY=your-claude-key prreviewbot review --url https://github.com/myorg/myrepo --branch feature-branch
```

This will:

1. Clone the repository
2. Analyze the code in the branch
3. Generate a report in `review-results.md`

### Example 2: Review with Specific Agents

```bash
# Review using only security and optimization agents with OpenAI
prreviewbot review --url https://github.com/myorg/myrepo --branch feature-branch --ai-model openai --ai-key your-openai-key --agents security,optimization
```

This will:

1. Clone the repository
2. Analyze the code using only security and optimization agents
3. Generate a report in `review-results.md`

### Example 3: Review with Ollama (Free, Self-Hosted)

```bash
# Review using Ollama with CodeLlama model
prreviewbot review --url https://github.com/myorg/myrepo --branch feature-branch --ai-model ollama --ai-options '{"model":"codellama"}'
```

This will:

1. Clone the repository
2. Analyze the code using the local Ollama server with CodeLlama
3. Generate a report in `review-results.md`

## Using as a GitHub Action

For GitHub Actions, set up a workflow using environment secrets:

```yaml
name: Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - name: Set up environment
        run: make install
      - name: Build project
        run: make build

      - name: Run PR Review
        run: prreviewbot review --url https://github.com/${{ github.repository }} --branch ${{ github.head_ref }} --output-format pr-comment
        env:
          GIT_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          AI_API_KEY: ${{ secrets.AI_API_KEY }}
          AI_MODEL: openai
```

## Extending the Bot

### Adding a Custom Agent

1. Create a new agent in `packages/agents/src/YourCustomAgent.ts`
2. Extend the `BaseAgent` class
3. Implement the `analyze` method
4. Export your agent in `packages/agents/src/index.ts`

### Adding a Custom AI Connector

1. Create a new connector in `packages/ai-connectors/src/connectors/YourConnector.ts`
2. Extend the `BaseAIConnector` class
3. Implement the `generateResponse` method
4. Update the `AIConnectorFactory` to support your connector
5. Export your connector in `packages/ai-connectors/src/index.ts`

## Troubleshooting

### API Connection Issues

- **Authentication Errors**: Verify your API keys are correct
- **Rate Limiting**: Commercial APIs have rate limits; check your usage quotas

### Ollama Issues

- **Connection Errors**: Make sure Ollama is running (`ps aux | grep ollama`)
- **Model Not Found**: Ensure you've pulled the model (`ollama list`)
- **Slow Responses**: Ollama performance depends on your hardware; consider using a smaller model

### GitHub Integration Issues

- **Authentication Errors**: Verify your GitHub token has the correct permissions
- **Rate Limiting**: GitHub API has rate limits; consider using a PAT with higher limits

### CLI Not Found

- Make sure you've built the project with `make build`
- Check that the CLI is properly installed and in your PATH
- Try running with the full command: `prreviewbot review --help`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
