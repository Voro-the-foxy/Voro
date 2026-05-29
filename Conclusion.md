# Conclusion

## What We Built & Fixed

### 1. Backend Architecture Refactor (Onion Architecture)

- **Layer separation**: Split all files into domain subdirectories
  - `handler/<domain>/handler.go` + `dto.go`
  - `service/<domain>/service.go` + `interface.go`
  - `gateway/postgres/<domain>.go`
- **Renamed** `gateway.go` → `interface.go` in service layer for clarity
- **Module rename**: `nomilk/backend` → `voro/backend`
- **Shared utilities**: Extracted `WriteJSON`/`WriteError` to `internal/shared/httputil`

### 2. Business Logic Relocation

Moved logic to the correct layer:

| What | From | To |
|---|---|---|
| Setup step validation | `gateway/postgres/setup.go` | `service/setup/service.go` |
| Quiz default values (count, difficulty, threshold) | `handler/quiz/handler.go` | `service/quiz/service.go` |

### 3. Error Handling

- All gateway methods now return `error` instead of silently swallowing failures
- DB errors are logged with `log.Printf` then wrapped as `apperrors.ErrInternalServer`
- `tx.Commit()` errors are now handled

### 4. Documentation

Added `README.md` to all four parts of the project:
- `/README.md` — project overview, system diagram, quick start
- `backend/README.md` — onion architecture, layer responsibilities, request flow
- `frontend/README.md` — file-based routing, API communication, Capacitor
- `ai-server/README.md` — PDF ingestion pipeline, quiz generation/validation agents

### 5. CI/CD (GitHub Actions)

`.github/workflows/ci.yml` runs on every push/PR to `main`:
- **Backend**: `go build` + unit tests + integration tests (with postgres container)
- **Frontend**: `npm run lint` + `npm run build`
- **AI Server**: `ruff check`

### 6. Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | `https://voro-nine.vercel.app` |
| Backend | Railway | `https://voro-production-405e.up.railway.app` |
| AI Server | Railway | Railway internal network |
| Database | Railway PostgreSQL | Railway internal network |

**Key fixes during deployment:**
- Added `PORT` env var support to Go server (Railway injects port dynamically)
- Moved `alembic upgrade head` to `preDeployCommand` to separate migration from server start
- Fixed `$PORT` shell expansion by wrapping startCommand in `sh -c '...'`
- Added `ALLOWED_ORIGIN` CORS support for Vercel frontend
- Fixed Railway DATABASE_URL format (`postgres://` → `postgresql+psycopg://`) via Pydantic validator in AI server config

## Final Architecture

```
Vercel (Frontend)
    │ HTTPS
    ▼
Railway (Backend :Go)  ──── Railway internal ────▶  Railway (AI Server: Python)
    │                                                      │
    └──────────────── Railway PostgreSQL ◀────────────────┘
```

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, TanStack Router, Tailwind CSS v4, Capacitor |
| Backend | Go 1.25, net/http, pgx/v5 |
| AI Server | Python 3.12, FastAPI, Claude Sonnet, Voyage AI |
| Database | PostgreSQL 16 + pgvector |
| CI/CD | GitHub Actions |
| Hosting | Vercel + Railway |
