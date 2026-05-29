# AI Server

AI processing server built with Python FastAPI. Stores PDF documents in a vector database and uses Claude to automatically generate and validate multiple-choice quiz questions.

- **Port**: `:8000`
- **Python**: 3.12+
- **Package manager**: [uv](https://docs.astral.sh/uv/)

---

## Architecture Overview

```mermaid
graph TD
    subgraph "API Layer"
        API["api/routes.py\n(FastAPI Router)"]
        SCH["api/schemas.py\n(Pydantic models)"]
    end

    subgraph "Agent Layer"
        ING["agents/ingestion.py\nPDF ingestion"]
        GEN["agents/generator.py\nQuiz generation"]
        VAL["agents/validator.py\nQuiz validation"]
    end

    subgraph "Service Layer"
        CHK["services/chunking.py\nText chunking"]
    end

    subgraph "LLM Clients"
        CL["llm/claude.py\nAnthropic Claude"]
        VO["llm/voyage.py\nVoyage AI embeddings"]
    end

    subgraph "DB Layer"
        MOD["db/models.py\n(SQLAlchemy ORM)"]
        SES["db/session.py\n(DB session)"]
        PG[("PostgreSQL\n+ pgvector")]
    end

    API --> ING
    API --> GEN
    API --> VAL
    ING --> CHK
    ING --> VO
    ING --> MOD
    GEN --> CL
    GEN --> MOD
    VAL --> CL
    VAL --> MOD
    MOD --> SES --> PG
```

---

## Layer Responsibilities

### api/ — HTTP Boundary

**`api/routes.py`** — FastAPI router. Validates requests with Pydantic, calls agents, and serializes responses. No business logic.

**`api/schemas.py`** — Pydantic request/response models.

```python
class QuizCreate(BaseModel):
    document_id: UUID
    count: int = Field(default=5, ge=1, le=20)
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    threshold: float = Field(default=0.7, ge=0.0, le=1.0)
```

---

### agents/ — Core Business Logic

This is where the actual AI processing pipelines live.

#### `agents/ingestion.py` — PDF Ingestion

```mermaid
flowchart LR
    PDF["PDF bytes"]
    EXT["Text extraction\n(pypdf)"]
    CHK["Chunking\n(chunking.py)"]
    EMB["Embedding generation\n(Voyage AI)"]
    DB["Save to DB\nDocument + Chunks"]

    PDF --> EXT --> CHK --> EMB --> DB
```

1. Extract text from PDF using `pypdf`
2. Split into chunks using `services/chunking.py`
3. Generate 1024-dimensional vector embeddings per chunk using Voyage AI (`voyage-3`)
4. Save `Document` + `Chunk` records (content + embedding) to the DB

#### `agents/generator.py` — Quiz Generation

```mermaid
flowchart LR
    DOC["Document ID"]
    CHUNKS["Fetch chunks\n(up to 30 sampled)"]
    CLAUDE["Call Claude\n(tool_use forced)"]
    VALID["Structural validation"]
    DB["Save Quiz + Questions"]

    DOC --> CHUNKS --> CLAUDE --> VALID --> DB
```

1. Sample up to 30 chunks for the given document
2. Force Claude to call `submit_questions` tool to return structured questions
3. Validate returned fields (`answer_index`, `source_chunk_ids`, etc.)
4. Save `Quiz` + `Question` records to the DB

**Claude prompting strategy:**
- `tool_choice: {"type": "tool", "name": "submit_questions"}` forces structured output
- System prompt strictly forbids using knowledge outside the provided material
- Difficulty guides: `easy` = recall, `medium` = concept application, `hard` = reasoning & synthesis

#### `agents/validator.py` — Quiz Validation

```mermaid
flowchart LR
    QUIZ["Quiz"]
    CHUNKS["Fetch related chunks"]
    CLAUDE["Call Claude\n(tool_use forced)"]
    SCORE["Apply scores\n(0.0 – 1.0)"]
    DB["Update validation_score"]

    QUIZ --> CHUNKS --> CLAUDE --> SCORE --> DB
```

1. Look up the source chunks referenced by each question's `source_chunk_ids`
2. Ask Claude to evaluate each question using the `submit_validation` tool across four criteria:
   - `correctness` — Is the answer grounded in the material?
   - `distractor_quality` — Are the wrong answers clearly wrong?
   - `clarity` — Is the question unambiguous?
   - `groundedness` — Does it avoid relying on external knowledge?
3. Store `overall` score (0.0–1.0) as `Question.validation_score`
4. Questions below `threshold` are filtered out from the response

---

### services/ — Utility Services

**`services/chunking.py`** — Splits long text into appropriately-sized chunks while preserving paragraph boundaries to keep semantic units intact.

---

### llm/ — LLM Clients (Singletons)

**`llm/claude.py`**

```python
DEFAULT_MODEL = "claude-sonnet-4-6"

def get_client() -> Anthropic:
    # singleton — initialized once per process
```

**`llm/voyage.py`**

```python
EMBEDDING_MODEL = "voyage-3"
EMBEDDING_DIM = 1024

def embed_documents(texts: list[str]) -> list[list[float]]: ...
def embed_query(text: str) -> list[float]: ...
```

---

### db/ — Database

**`db/models.py`** — SQLAlchemy ORM models

```mermaid
erDiagram
    Document {
        UUID id PK
        String title
        String source_type
        DateTime uploaded_at
    }
    Chunk {
        UUID id PK
        UUID document_id FK
        int chunk_index
        Text content
        Vector embedding
    }
    Quiz {
        UUID id PK
        UUID document_id FK
        String status
        DateTime created_at
    }
    Question {
        UUID id PK
        UUID quiz_id FK
        Text question_text
        JSON choices
        int answer_index
        Text explanation
        Array source_chunk_ids
        float validation_score
    }

    Document ||--o{ Chunk : "has"
    Document ||--o{ Quiz : "has"
    Quiz ||--o{ Question : "has"
```

**`db/session.py`** — Provides a DB session as a FastAPI dependency.

> The AI server uses its own tables (`documents`, `chunks`, `quizzes`, `questions`) completely separate from the Go backend's tables (`users`, `sessions`, `alarms`, etc.). Both services share the same PostgreSQL instance but do not touch each other's tables.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/documents` | Upload + ingest a PDF |
| `GET` | `/api/documents` | List all documents |
| `DELETE` | `/api/documents/{id}` | Delete a document (cascades to chunks and quizzes) |
| `POST` | `/api/quizzes` | Generate and validate a quiz |
| `GET` | `/api/quizzes/{id}` | Get a quiz by ID |

> The Go backend proxies all of these. The frontend never calls the AI server directly.

---

## Full Quiz Generation Flow

```mermaid
sequenceDiagram
    participant GoBackend
    participant FastAPI
    participant ingestion
    participant generator
    participant validator
    participant Claude
    participant VoyageAI
    participant PostgreSQL

    Note over GoBackend, PostgreSQL: Phase 1 — PDF Upload

    GoBackend->>FastAPI: POST /api/documents (PDF)
    FastAPI->>ingestion: ingest_pdf(db, title, pdf_bytes)
    ingestion->>ingestion: extract text with pypdf
    ingestion->>ingestion: chunk_text()
    ingestion->>VoyageAI: embed_documents(chunks)
    VoyageAI-->>ingestion: 1024-dim vectors × N
    ingestion->>PostgreSQL: save Document + Chunks
    ingestion-->>FastAPI: Document object
    FastAPI-->>GoBackend: DocumentDTO

    Note over GoBackend, PostgreSQL: Phase 2 — Quiz Generation

    GoBackend->>FastAPI: POST /api/quizzes {document_id, count, difficulty}
    FastAPI->>generator: generate_quiz(db, document_id, count, difficulty)
    generator->>PostgreSQL: fetch chunks (up to 30)
    generator->>Claude: generate questions (submit_questions tool)
    Claude-->>generator: structured question list
    generator->>PostgreSQL: save Quiz + Questions

    FastAPI->>validator: validate_quiz(db, quiz, threshold)
    validator->>PostgreSQL: fetch related chunks
    validator->>Claude: evaluate questions (submit_validation tool)
    Claude-->>validator: per-question scores (0.0–1.0)
    validator->>PostgreSQL: update validation_score

    FastAPI-->>GoBackend: QuizDTO (questions below threshold filtered out)
```

---

## Environment Variables

`ai-server/.env` (copy from `.env.example`):

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API key |
| `VOYAGE_API_KEY` | Yes | Voyage AI embedding API key |
| `DATABASE_URL` | Yes | PostgreSQL connection string (`postgresql+psycopg://...`) |

---

## DB Migrations

Managed by Alembic.

```bash
make ai-migrate              # Apply latest migrations
make ai-revision m="message" # Auto-generate a new migration file
```

---

## Make Commands

```bash
make ai-install                  # uv sync (install dependencies)
make ai-dev                      # Run FastAPI dev server (:8000, --reload)
make ai-migrate                  # Alembic upgrade head
make ai-revision m="description" # Generate migration file
make ai-lint                     # Run ruff linter
```

---

## Tech Stack

| Library | Purpose |
|---|---|
| FastAPI 0.115 | HTTP API framework |
| SQLAlchemy 2.0 | ORM |
| Alembic | DB migrations |
| pgvector | PostgreSQL vector extension |
| Anthropic SDK | Claude API client (`claude-sonnet-4-6`) |
| Voyage AI | Text embeddings (`voyage-3`, 1024-dim) |
| pypdf | PDF text extraction |
| Pydantic v2 | Request/response validation |
| uv | Package management |
