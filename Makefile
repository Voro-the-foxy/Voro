.PHONY: backend-run backend-build frontend-dev frontend-build frontend-install \
        db-up db-down db-logs db-psql db-reset \
        ai-install ai-dev ai-migrate ai-revision ai-lint \
        dev dev-stop

.ONESHELL:
SHELL := /bin/bash

backend-run:
	cd backend && go run ./cmd/server

backend-build:
	cd backend && go build -o bin/server ./cmd/server

frontend-install:
	cd frontend && npm install

frontend-dev: frontend-install
	cd frontend && npm run dev

frontend-build: frontend-install
	cd frontend && npm run build

# --- Infra (Postgres + pgvector) ---

db-up:
	cd infra && docker compose up -d

db-down:
	cd infra && docker compose down

db-logs:
	cd infra && docker compose logs -f postgres

db-psql:
	cd infra && docker compose exec postgres psql -U $${POSTGRES_USER:-voro} -d $${POSTGRES_DB:-voro}

db-reset:
	cd infra && docker compose down -v && docker compose up -d

# --- AI server (Python / FastAPI) ---

ai-install:
	cd ai-server && uv sync

ai-dev: ai-install
	cd ai-server && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

ai-migrate:
	cd ai-server && uv run alembic upgrade head

ai-revision:
	cd ai-server && uv run alembic revision --autogenerate -m "$(m)"

ai-lint:
	cd ai-server && uv run ruff check .

# --- One-shot full stack ---

dev: ai-install frontend-install
	@set -e
	test -f frontend/.env || cp frontend/.env.example frontend/.env
	if [ ! -f ai-server/.env ]; then \
	  echo "❌ ai-server/.env 가 없습니다. ANTHROPIC_API_KEY / VOYAGE_API_KEY / DATABASE_URL 을 채워주세요."; \
	  exit 1; \
	fi
	echo "[1/4] Postgres (port 5433)..."
	(cd infra && docker compose up -d --wait)
	echo "[2/4] AI server DB migrations..."
	(cd ai-server && uv run alembic upgrade head)
	echo "[3/4] launching AI:8000, GO:8080, WEB:5173..."
	trap 'echo; echo "→ stopping services..."; kill 0' INT TERM
	(cd ai-server && exec uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) 2>&1 | awk '{print "[AI ]", $$0; fflush()}' &
	(cd backend  && exec go run ./cmd/server) 2>&1 | awk '{print "[GO ]", $$0; fflush()}' &
	(cd frontend && exec npm run dev)         2>&1 | awk '{print "[WEB]", $$0; fflush()}' &
	echo "[4/4] up — http://localhost:5173  (Ctrl+C 로 모두 종료)"
	wait

dev-stop:
	@echo "→ stopping..."
	-cd infra && docker compose down
	-lsof -ti:8000 | xargs kill 2>/dev/null || true
	-lsof -ti:8080 | xargs kill 2>/dev/null || true
	-lsof -ti:5173 | xargs kill 2>/dev/null || true
	@echo "done."
