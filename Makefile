# Load environment variables from .env file
include .env
export

start-local-db:
	docker compose up -d

dev:
	docker compose up -d
	bun run db:migrate
	bun run dev

stop-local-db:
	docker compose down

# Alternative dev command that explicitly sources .env (if the above doesn't work)
dev-alt:
	docker compose up -d
	set -a && source .env && set +a && bun run db:migrate
	set -a && source .env && set +a && bun run dev

# Debug: Print environment variables to verify they're loaded
debug-env:
	@echo "Database URL: $(DATABASE_URL)"
	@echo "GitHub Client ID: $(GITHUB_CLIENT_ID)"
	@echo "Port: $(PORT)"