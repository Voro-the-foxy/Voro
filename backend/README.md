# Backend

HTTP API server written in Go. Follows Onion Architecture and handles domains including schedule, alarms, quizzes, exams, and authentication.

- **Port**: `:8080`
- **Go**: 1.25+
- **Module path**: `voro/backend`

---

## Architecture Overview

The core principle of Onion Architecture is that **dependencies always point inward toward the domain**. Outer layers know about inner layers, but inner layers know nothing about outer layers.

```mermaid
graph TD
    subgraph "External"
        HTTP["HTTP Request"]
        PG["PostgreSQL"]
        AIS["AI Server :8000"]
    end

    subgraph "handler layer"
        H["handler/*\nHTTP decode / encode"]
    end

    subgraph "service layer"
        S["service/*\nBusiness logic & use cases"]
        I["service/*/interface.go\n(Gateway interface)"]
    end

    subgraph "domain layer"
        D["domain/*\nPure entities & rules"]
    end

    subgraph "gateway layer"
        GP["gateway/postgres/*\nSQL execution"]
        GA["gateway/ai/*\nHTTP calls"]
    end

    HTTP --> H
    H --> S
    S --> I
    S --> D
    I -.->|implements| GP
    I -.->|implements| GA
    GP --> PG
    GA --> AIS
```

---

## Layer Responsibilities

### domain — Pure Business Entities

**Location**: `internal/domain/`

Plain Go types and rules with zero external dependencies. No JSON tags, no DB, no HTTP — none of those concerns belong here.

```
domain/
├── alarm.go      # Alarm entity
├── attempt.go    # Attempt (quiz session result) entity
├── class.go      # ClassItem entity
├── exam.go       # Exam (exam schedule) entity
├── note.go       # Note (lecture material) entity
├── quiz.go       # Document, Question, Quiz entities
├── setup.go      # SetupState (onboarding progress) entity
└── user.go       # User, Session entities
```

- No I/O, no framework imports
- Does not import any other internal package
- Unaffected by changes in outer layers

---

### service — Business Logic & Use Cases

**Location**: `internal/service/<domain>/`

Handles the use cases for each domain. Input validation, default values, ID generation — any rule about "how something should be processed" lives here.

```
service/
├── alarm/
│   ├── interface.go   # Gateway interface definition (consumer-owned)
│   └── service.go     # Use case implementation
├── attempt/
├── auth/
├── class/
├── exam/
├── note/
├── quiz/
└── setup/
```

**Each file's role:**

- `interface.go` — Declares what this service needs from the outside (gateway). Interface only, no implementation.
- `service.go` — Implements use cases. Communicates with the outside world only through the gateway interface.

```go
// interface.go — only what the service needs
type Gateway interface {
    List() ([]domain.Alarm, error)
    ReplaceAll(alarms []domain.Alarm) ([]domain.Alarm, error)
}

// service.go — business rules live here
func (s *Service) MarkStep(step string) (domain.SetupState, error) {
    if !validSteps[step] {          // business rule: is this a valid step?
        return domain.SetupState{}, apperrors.ErrInvalidRequest
    }
    return s.Gateway.MarkStep(step)
}
```

> **Consumer-owned interface principle**: The Gateway interface is defined in `service/`, not in `gateway/`. This means the service has zero knowledge of how the interface is implemented. You can swap PostgreSQL for a different store or inject a mock without touching any service code.

---

### gateway — External System Adapters

**Location**: `internal/gateway/`

Implements the interfaces defined by the service layer. Its only responsibility is to talk to external systems (DB, AI server) and translate the results into domain types.

```
gateway/
├── postgres/       # PostgreSQL adapter
│   ├── client.go   # DB connection + migrations
│   ├── alarm.go    # AlarmGateway (implements service/alarm.Gateway)
│   ├── attempt.go
│   ├── auth.go
│   ├── class.go
│   ├── exam.go
│   ├── note.go
│   └── setup.go
└── ai/             # AI server HTTP adapter
    └── quiz.go     # QuizGateway (implements service/quiz.Gateway)
```

- No business decisions — only I/O and data translation
- DB errors are logged with `log.Printf` then wrapped as `apperrors.ErrInternalServer`
- AI-server-specific JSON types (`aiDocument`, `aiQuiz`) are defined inside the package to prevent domain pollution

```go
// AI-specific JSON type — stays inside the gateway package, never leaks into domain
type aiQuiz struct {
    ID         string       `json:"id"`
    DocumentID string       `json:"document_id"`
    Questions  []aiQuestion `json:"questions"`
}

// Converted to a domain type before returning
return &domain.Quiz{ID: q.ID, DocumentID: q.DocumentID, ...}, nil
```

---

### handler — HTTP Boundary

**Location**: `internal/handler/<domain>/`

The outermost layer. Handles HTTP requests and responses. Contains no business logic — only decode → call service → encode.

```
handler/
├── alarm/
│   ├── handler.go   # HTTP handler methods
│   └── dto.go       # Request/response JSON structs
├── attempt/
├── auth/
├── class/
├── exam/
├── note/
├── quiz/
└── setup/
```

**Each file's role:**

- `handler.go` — HTTP handlers. `json.Decode` → `service.X()` → `httputil.WriteJSON`
- `dto.go` — Transport structs with JSON tags. Kept separate from domain types.

```go
// handler only decodes and encodes
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
    alarms, err := h.Service.List()
    if err != nil {
        httputil.WriteError(w, err)
        return
    }
    out := make([]DTO, len(alarms))
    for i, a := range alarms { out[i] = toDTO(a) }
    httputil.WriteJSON(w, http.StatusOK, out)
}
```

---

### shared — Shared Utilities

**Location**: `internal/shared/`

```
shared/
├── errors/
│   └── errors.go    # AppError + common error sentinels
├── gen/
│   └── gen.go       # ID generation (UUID), current time (milliseconds)
└── httputil/
    └── response.go  # WriteJSON, WriteError (shared across all handlers)
```

---

## Dependency Rule Verification

```bash
# service must never import gateway — this should return no results
grep -rn "internal/gateway" backend/internal/service/
```

---

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant handler
    participant service
    participant gateway
    participant DB/AI

    Client->>handler: HTTP request
    handler->>handler: JSON decode + basic input check
    handler->>service: call business method
    service->>service: apply business rules
    service->>gateway: call Gateway interface
    gateway->>DB/AI: execute SQL / HTTP
    DB/AI-->>gateway: raw result
    gateway->>gateway: convert to domain type
    gateway-->>service: domain object or error
    service-->>handler: result or error
    handler->>handler: domain → DTO conversion
    handler-->>Client: JSON response
```

---

## Error Handling

Errors use sentinels defined in `internal/shared/errors/errors.go`.

| Sentinel | HTTP Status | When |
|---|---|---|
| `ErrNotFound` | 404 | Resource does not exist |
| `ErrInvalidRequest` | 400 | Invalid input |
| `ErrUnauthorized` | 401 | Authentication required |
| `ErrInternalServer` | 500 | Unexpected server error |
| `ErrInvalidCredentials` | 401 | Wrong email or password |
| `ErrInvalidToken` | 401 | Session token is invalid |

When a DB error occurs in the gateway layer, the raw error is logged with `log.Printf` and only `ErrInternalServer` is returned to the caller. Raw DB errors never leak to the client.

---

## DB Migrations

No separate migration tool. `ApplyMigrations()` in `gateway/postgres/client.go` runs `CREATE TABLE IF NOT EXISTS` statements on every server start.

To add a new table, append its `CREATE TABLE IF NOT EXISTS` SQL to the block in `client.go`.

---

## Full File Structure

```
backend/
├── cmd/server/
│   └── main.go                  # Entry point + DI wiring + routing
├── internal/
│   ├── domain/                  # Pure entities
│   ├── service/
│   │   ├── alarm/
│   │   │   ├── interface.go
│   │   │   └── service.go
│   │   └── ... (8 domains)
│   ├── gateway/
│   │   ├── postgres/            # DB adapter
│   │   └── ai/                  # AI server adapter
│   ├── handler/
│   │   ├── alarm/
│   │   │   ├── handler.go
│   │   │   └── dto.go
│   │   └── ... (8 domains)
│   └── shared/
│       ├── errors/
│       ├── gen/
│       └── httputil/
├── go.mod
└── go.sum
```

---

## Make Commands

```bash
make backend-run     # Run the dev server (requires DATABASE_URL)
make backend-build   # Build bin/server
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://voro:voro@localhost:5433/voro?sslmode=disable` | PostgreSQL connection string |
| `AI_SERVER_URL` | `http://localhost:8000` | AI server base URL |

### Tests

```bash
cd backend
go test ./...                        # Unit tests (no DB required)
go test -tags integration ./...      # Integration tests (requires TEST_DATABASE_URL)
```
