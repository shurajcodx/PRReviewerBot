tag = 0
version = 1.0

build.agent:
	@printf "\033[0;32m>>> Building libs\033[0m\n"
	pnpm run build:agent

install:
	@printf "\033[0;32m>>> Installing dependencies\033[0m\n"
	pnpm -r install
