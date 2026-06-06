# Voro — dev / run commands
#
#   make web          Web frontend dev server (:5173)
#   make app          App (real device, dev) — auto LAN IP, opens Android Studio
#   make app-release  App (release) — HTTPS from .env.production, release build
#   make db           Start the Postgres container only (:5433)
#   make server       Start the backend API only (:8080)
#   make all          Start db + AI + backend + web together
#   make test         Backend test suite (unit + e2e)
#   make stop         Stop everything
#   make deploy       Production: build & start all containers (needs infra/.env.prod)
#   utils: make db-reset  /  make db-psql

.PHONY: help web app app-release db server all test stop deploy db-reset db-psql

HOST_IP := $(shell ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)

SHELL := /bin/bash

help:
	@echo "Voro — make <target>"
	@echo "  web          Web frontend dev server (:5173)"
	@echo "  app          App (real device, dev) — auto LAN IP, Android Studio. Emulator: make app HOST_IP=10.0.2.2"
	@echo "  app-release  App (release) — .env.production HTTPS, release build"
	@echo "  db           Postgres container only (:5433)"
	@echo "  server       Backend API only (:8080)"
	@echo "  all          db + AI + backend + web together"
	@echo "  test         Backend test suite (unit + e2e)"
	@echo "  stop         Stop everything   |  db-reset / db-psql"
	@echo "  deploy       Production — build & start all containers (needs infra/.env.prod)"

# ── Web ──────────────────────────────────────────────────────────────────────
web:
	cd frontend && npm install && npm run dev

# ── App ──────────────────────────────────────────────────────────────────────
# Dev (real device): cleartext HTTP backend + debug build (cleartext allowed).
# When Android Studio opens, Run the debug variant.
app:
	@test -n "$(HOST_IP)" || { echo "✗ Could not detect LAN IP — check that the phone and Mac are on the same WiFi"; exit 1; }
	@echo "→ Backend URL: http://$(HOST_IP):8080  (phone and Mac must be on the same WiFi)"
	@echo "  (For an emulator: make app HOST_IP=10.0.2.2)"
	cd frontend && npm install && VITE_API_BASE_URL=http://$(HOST_IP):8080 npm run build && npx cap sync android && npx cap open android

# Release: HTTPS backend (.env.production) + release build (cleartext blocked).
# In Android Studio, switch to the release variant and sign the build.
app-release:
	@grep -q "example.com" frontend/.env.production 2>/dev/null && echo "⚠️  Replace the domain in frontend/.env.production with your real deployment URL" || true
	cd frontend && npm install && npm run build && npx cap sync android && npx cap open android

# ── DB ───────────────────────────────────────────────────────────────────────
db:
	cd infra && docker compose up -d --wait

# ── Server ───────────────────────────────────────────────────────────────────
server:
	cd backend && go run ./cmd/server

# ── All (db + AI + backend + web) ────────────────────────────────────────────
all:
	@set -e; \
	test -f frontend/.env || cp frontend/.env.example frontend/.env; \
	if [ ! -f ai-server/.env ]; then \
	  echo "❌ ai-server/.env is missing. Fill in ANTHROPIC_API_KEY / VOYAGE_API_KEY / DATABASE_URL."; \
	  exit 1; \
	fi; \
	echo "[1/4] Postgres (:5433)..."; \
	(cd infra && docker compose up -d --wait); \
	echo "[2/4] AI server DB migrations..."; \
	(cd ai-server && uv sync && uv run alembic upgrade head); \
	echo "[3/4] Frontend dependencies..."; \
	(cd frontend && npm install >/dev/null); \
	echo "[4/4] Up — AI:8000 / GO:8080 / WEB:5173  (Ctrl+C to stop all)"; \
	trap 'echo; echo "→ stopping services..."; kill 0' INT TERM; \
	(cd ai-server && exec uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000) 2>&1 | awk '{print "[AI ]", $$0; fflush()}' & \
	(cd backend  && exec go run ./cmd/server)                                                2>&1 | awk '{print "[GO ]", $$0; fflush()}' & \
	(cd frontend && exec npm run dev)                                                        2>&1 | awk '{print "[WEB]", $$0; fflush()}' & \
	wait

# ── Test (backend unit + e2e) ────────────────────────────────────────────────
test:
	@set -e; \
	echo "==> Backend unit tests"; \
	(cd backend && go test ./internal/...); \
	echo "==> Starting test DB (:5434, isolated from the dev DB)"; \
	(cd infra && docker compose -f docker-compose.test.yml up -d --wait); \
	echo "==> Backend e2e tests"; \
	rc=0; \
	(cd backend && TEST_DATABASE_URL=postgres://voro:voro@localhost:5434/voro_test?sslmode=disable \
	  go test -tags e2e -v ./internal/e2e/...) || rc=$$?; \
	echo "==> Stopping test DB"; \
	(cd infra && docker compose -f docker-compose.test.yml down); \
	exit $$rc

# ── Deploy (production) ──────────────────────────────────────────────────────
deploy:
	@test -f infra/.env.prod || { echo "❌ infra/.env.prod not found. Copy infra/.env.prod.example and fill in real values."; exit 1; }
	cd infra && docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build

# ── Utils ────────────────────────────────────────────────────────────────────
stop:
	@echo "→ stopping..."
	-cd infra && docker compose down
	-pkill -f "uvicorn app.main:app" 2>/dev/null || true
	-pkill -f "go run ./cmd/server" 2>/dev/null || true
	-pkill -f "vite" 2>/dev/null || true
	-lsof -ti:8000 | xargs kill -9 2>/dev/null || true
	-lsof -ti:8080 | xargs kill -9 2>/dev/null || true
	-lsof -ti:5173 | xargs kill -9 2>/dev/null || true
	@echo "done."

db-reset:
	cd infra && docker compose down -v && docker compose up -d --wait

db-psql:
	cd infra && docker compose exec postgres psql -U $${POSTGRES_USER:-voro} -d $${POSTGRES_DB:-voro}
