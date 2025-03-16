tag = 0
version = 1.0

# Build targets for individual packages
build.agent:
	@printf "\033[0;32m>>> Building agents package\033[0m\n"
	pnpm --filter @pr-reviewer-bot/agents build

build.core:
	@printf "\033[0;32m>>> Building core package\033[0m\n"
	pnpm --filter @pr-reviewer-bot/core build

build.ai-connectors:
	@printf "\033[0;32m>>> Building AI connectors package\033[0m\n"
	pnpm --filter @pr-reviewer-bot/ai-connectors build

build.output:
	@printf "\033[0;32m>>> Building output package\033[0m\n"
	pnpm --filter @pr-reviewer-bot/output build

build.cli: build.core build.agent build.ai-connectors build.output
	@printf "\033[0;32m>>> Building CLI package\033[0m\n"
	pnpm --filter @pr-reviewer-bot/cli build

# Build all packages
build: build.core build.ai-connectors build.agent build.output build.cli
	@printf "\033[0;32m>>> Build completed\033[0m\n"

# Install dependencies
install:
	@printf "\033[0;32m>>> Installing dependencies\033[0m\n"
	pnpm -r install

# Target to run the CLI
run-cli:
	@printf "\033[0;32m>>> Running the CLI...\033[0m\n"
	node packages/cli/dist/index.js

# Target to install the CLI globally
install-cli: build.cli
	@printf "\033[0;32m>>> Installing CLI globally...\033[0m\n"
	cd packages/cli && npm link

# Target to uninstall the CLI globally
uninstall-cli:
	@printf "\033[0;32m>>> Uninstalling CLI globally...\033[0m\n"
	npm unlink -g @pr-reviewer-bot/cli

# Run tests
test:
	@printf "\033[0;32m>>> Running tests\033[0m\n"
	pnpm -r test

# Lint code
lint:
	@printf "\033[0;32m>>> Linting code\033[0m\n"
	pnpm lint

# Fix linting issues
lint-fix:
	@printf "\033[0;32m>>> Fixing linting issues\033[0m\n"
	pnpm lint:fix

# Format code
format:
	@printf "\033[0;32m>>> Formatting code\033[0m\n"
	pnpm format

# Check code formatting
format-check:
	@printf "\033[0;32m>>> Checking code formatting\033[0m\n"
	pnpm format:check

# Clean build artifacts
clean:
	@printf "\033[0;32m>>> Cleaning build artifacts\033[0m\n"
	rm -rf packages/*/dist
	rm -rf packages/*/node_modules
	rm -rf node_modules

.PHONY: build.agent build.core build.ai-connectors build.output build.cli build install init-structure run-cli install-cli uninstall-cli test lint lint-fix format format-check clean
