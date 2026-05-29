# Voro

An AI-powered study assistant app built around lecture materials. Upload a PDF and Claude automatically generates multiple-choice questions. Manage your study schedule, alarms, and exam dates — all in a mobile web app.

---

## System Architecture

```mermaid
graph TD
    FE["Frontend\nReact 19 + Vite\n:5173"]
    BE["Backend (Go)\nHTTP API\n:8080"]
    AI["AI Server (Python)\nFastAPI\n:8000"]
    DB[("PostgreSQL 16\n+ pgvector\n:5433")]

    FE -- "REST API" --> BE
    BE -- "HTTP (documents & quizzes)" --> AI
    BE -- "SQL" --> DB
    AI -- "SQL + pgvector" --> DB
```

| Service | Role | Stack |
|---|---|---|
| **Frontend** | Mobile UI (375×812 viewport) | React 19, Vite, TanStack Router, Tailwind CSS v4, Capacitor |
| **Backend** | Business logic + REST API | Go 1.25, `net/http`, pgx/v5 |
| **AI Server** | PDF ingestion, quiz generation & validation | Python 3.12, FastAPI, Claude Sonnet, Voyage AI |
| **Infra** | Database | PostgreSQL 16 + pgvector (Docker) |

---

## Quick Start

### Prerequisites

- Docker Desktop
- Go 1.25+
- Node.js 20+
- Python 3.12+ + [uv](https://docs.astral.sh/uv/)

### Environment Variables

```bash
# AI server (required)
cp ai-server/.env.example ai-server/.env
# Fill in the following values in ai-server/.env:
# ANTHROPIC_API_KEY=sk-ant-...
# VOYAGE_API_KEY=pa-...
# DATABASE_URL=postgresql+psycopg://voro:voro@localhost:5433/voro

# Backend (works with defaults)
cp backend/.env.example backend/.env

# Frontend (make dev copies this automatically)
cp frontend/.env.example frontend/.env
```

### Run the Full Stack

```bash
make dev
```

Open http://localhost:5173 in your browser. Press Ctrl+C to stop everything.

---

## Make Commands

### Development

| Command | Description |
|---|---|
| `make dev` | Start Postgres → run AI migrations → launch AI, Go, and Web servers in parallel |
| `make dev-stop` | Stop all running services |

### Backend (Go)

| Command | Description |
|---|---|
| `make backend-run` | Run the Go dev server (`:8080`) |
| `make backend-build` | Build the binary to `backend/bin/server` |

### Frontend

| Command | Description |
|---|---|
| `make frontend-install` | Install npm packages |
| `make frontend-dev` | Run the Vite dev server (`:5173`) |
| `make frontend-build` | Production build (`tsc -b && vite build`) |

### Database

| Command | Description |
|---|---|
| `make db-up` | Start the Postgres container |
| `make db-down` | Stop the Postgres container |
| `make db-reset` | Wipe all data and restart |
| `make db-logs` | Stream Postgres logs |
| `make db-psql` | Open a psql shell |

### AI Server

| Command | Description |
|---|---|
| `make ai-install` | Install dependencies via uv sync |
| `make ai-dev` | Run the FastAPI dev server (`:8000`) |
| `make ai-migrate` | Apply Alembic migrations |
| `make ai-revision m="message"` | Generate a new migration file |
| `make ai-lint` | Run ruff linter |

---

## Ports

| Port | Service |
|---|---|
| `5173` | Frontend (Vite dev server) |
| `8080` | Backend (Go HTTP API) |
| `8000` | AI Server (FastAPI) |
| `5433` | PostgreSQL (host port; container internal port is 5432) |

> Port 5433 is used to avoid conflicts with a locally installed PostgreSQL instance.

---

## Project Structure

```
Voro/
├── backend/          # Go HTTP API (Onion Architecture)
├── frontend/         # React SPA (mobile web + Capacitor)
├── ai-server/        # Python FastAPI (PDF ingestion, quiz generation)
├── infra/            # docker-compose.yml (Postgres + pgvector)
└── Makefile          # Root-level task runner
```

---

## Data Flow — Quiz Generation

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AIServer
    participant PostgreSQL

    User->>Frontend: Select PDF file
    Frontend->>Backend: POST /api/documents (multipart)
    Backend->>AIServer: POST /api/documents (proxy)
    AIServer->>AIServer: Extract text from PDF
    AIServer->>AIServer: Chunk text
    AIServer->>AIServer: Generate embeddings via Voyage AI
    AIServer->>PostgreSQL: Save Document + Chunks + embeddings
    AIServer-->>Backend: DocumentDTO
    Backend-->>Frontend: DocumentDTO

    User->>Frontend: Request quiz generation
    Frontend->>Backend: POST /api/quizzes
    Backend->>AIServer: POST /api/quizzes
    AIServer->>PostgreSQL: Fetch chunks
    AIServer->>AIServer: Generate questions with Claude
    AIServer->>AIServer: Validate questions with Claude
    AIServer->>PostgreSQL: Save Quiz + Questions
    AIServer-->>Backend: QuizDTO
    Backend-->>Frontend: QuizDTO
    Frontend->>User: Display quiz
```
