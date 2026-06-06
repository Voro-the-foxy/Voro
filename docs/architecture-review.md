# Voro Backend Architecture Review & Remediation Report

> Target: `main` branch (vibe-coded) · backend-focused
> Purpose: catalog the tech debt by priority, and describe each item as a **unit of work a future Claude Code session can pick up directly.**

---

## 0. TL;DR

The bones (onion dependency direction, domain purity, auth context propagation) are **already in good shape**.
The debt is concentrated in three places: ① **DB migrations**, ② **a few security/robustness gaps**, ③ **doc/structure drift**.
The `setup ensureRow ... column "user_id" does not exist` error currently flooding the logs is a direct symptom of ①.

---

## 1. What's already good (preserve)

Agreements that **must not be broken** by new code. (The rules in `CLAUDE.md` are actually being followed.)

| Principle | Check | Status |
|---|---|---|
| `service/` does not import `gateway/` | `grep -rn internal/gateway internal/service` → 0 | ✅ |
| No JSON tags / framework imports in `domain/` | `grep '\`json:' / net/http / database/sql` → 0 | ✅ |
| Gateway interfaces owned by the consumer (service) | `service/<x>/interface.go` pattern | ✅ |
| Per-domain packages | `handler/<x>` · `service/<x>` · `gateway/postgres/<x>.go` | ✅ |
| Authenticated user propagated via context | `shared/authctx` + `server/middleware.go` | ✅ |

> Conclusion: this stage needs **local fixes + infrastructure (migration/security) hardening**, not a rewrite. Do not tear down the structure.

---

## 2. Debt list (by priority)

### 🔴 P0-1. `setup` table missing the `user_id` column migration — **live bug**

- **Symptom**: `setup ensureRow: ERROR: column "user_id" of relation "setup" does not exist (SQLSTATE 42703)` on every request.
- **Location**: `backend/internal/gateway/postgres/client.go:122-128`
- **Root cause**: every other table (`classes`/`notes`/`alarms`/`exams`/`attempts`) has an
  `ALTER TABLE ... ADD COLUMN IF NOT EXISTS user_id ...` backfill — but **`setup` is the only one missing it.**
  If an older `setup` table already exists in the DB, `CREATE TABLE IF NOT EXISTS` is a no-op, so `user_id` is never added.
- **Immediate hotfix** (append right after the `setup` CREATE block in client.go):
  ```sql
  ALTER TABLE setup ADD COLUMN IF NOT EXISTS user_id  TEXT    PRIMARY KEY;  -- see note below
  ALTER TABLE setup ADD COLUMN IF NOT EXISTS schedule BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE setup ADD COLUMN IF NOT EXISTS alarm    BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE setup ADD COLUMN IF NOT EXISTS exam     BOOLEAN NOT NULL DEFAULT false;
  ALTER TABLE setup ADD COLUMN IF NOT EXISTS notes    BOOLEAN NOT NULL DEFAULT false;
  ```
  > Note: `ADD COLUMN ... PRIMARY KEY` fails if the table already has a PK. The safest quick fix on a
  > dev DB is `make db-reset` to recreate. If there's production data, handle it via the proper
  > migration in P0-2.
- **Work unit**: handle together with P0-2 (same root).

---

### 🔴 P0-2. DB migration strategy is ad-hoc — the root of the debt

- **Location**: all of `backend/internal/gateway/postgres/client.go` (`ApplyMigrations`)
- **Current approach**:
  - `CREATE TABLE IF NOT EXISTS` + per-table scattered `ALTER TABLE ADD COLUMN IF NOT EXISTS`
  - old-schema cleanup hardcoded as `DO $$ ... DROP TABLE ... $$` (client.go:23-53)
  - no versioning, ordering, rollback, or history. "Forget one line" and it silently breaks (see P0-1).
- **Why it's debt**: there is no single source of truth for the schema. You can't tell which DB is in which state.
  Piling on `IF NOT EXISTS` backfills columns you already created, but can't fix changed types/constraints.
- **Direction** (pick one, A recommended):
  - **A. Adopt a real migration tool** — `golang-migrate` or `goose`.
    `backend/migrations/0001_init.sql`, `0002_add_user_scoping.sql`, … numbered files.
    Run `up` on startup in `main()`. The AI server already uses Alembic, so this also improves consistency.
  - **B. Minimal improvement** — without a tool, a `schema_migrations(version)` table + an ordered
    `[]string` of SQL applied "once, in order." Remove the DROP hacks.
- **Work units (slice)**:
  1. Write the **final schema** (incl. user_id) of all 8 current tables cleanly into `migrations/0001_init.sql`.
  2. Add the migration runner + remove inline SQL / DROP hacks from `client.go`/`main.go`.
  3. `make db-reset`, confirm e2e passes.
  - Acceptance: 0 inline DDL / `DO $$ DROP` in `client.go`. Adding a column = "one new file."

---

### 🟠 P1-1. Password hashing is **unsalted SHA-256**

- **Location**: `backend/internal/gateway/postgres/auth.go` — `hashPassword()` = `sha256.Sum256(password)`
- **Problem**: SHA-256 is fast and unsalted — vulnerable to rainbow tables / brute force. Wrong for password storage.
- **Direction**: switch to `golang.org/x/crypto/bcrypt` (or argon2id).
  - signup: `bcrypt.GenerateFromPassword`, login: `bcrypt.CompareHashAndPassword`.
  - migration: keep the column, rehash existing hashes on next login (or, at this stage, just reset).
- **Work unit**: one gateway file + a go.mod dependency. No signature change (internal function swap).
  - Acceptance: 0 `sha256` imports in `auth.go`. Login/signup e2e passes.

### 🟠 P1-2. `setup.MarkStep` builds **dynamic SQL by string concatenation**

- **Location**: `gateway/postgres/setup.go:47` — ``g.db.Exec("UPDATE setup SET "+step+"=true WHERE user_id=$1")``
- **Problem**: column name is concatenated → SQL injection surface. Currently relies only on the **discipline**
  of "allowlist validation in the service layer." Not structurally safe.
- **Direction**: replace with a `step → fixed query` mapping.
  ```go
  var q string
  switch step {
  case "schedule": q = `UPDATE setup SET schedule=true WHERE user_id=$1`
  case "alarm":    q = `UPDATE setup SET alarm=true    WHERE user_id=$1`
  // ...
  default: return domain.SetupState{}, apperrors.ErrInvalidRequest
  }
  ```
- **Work unit**: setup.go, one file. Acceptance: 0 string + SQL concatenation in the gateway.

---

### 🟡 P2-1. Multi-tenancy is **bolted on via `user_id TEXT NOT NULL DEFAULT ''`**

- **Location**: nearly every table in client.go. No FK to `users(id)` either (only `sessions→users(email)` exists).
- **Problems**:
  - `DEFAULT ''` means that **even with an empty auth context, rows are silently written with an empty user_id** → data can leak "global" or get mixed.
  - missing FK → orphaned data when a user is deleted.
- **Direction**: together with the P0-2 proper migration,
  - `user_id TEXT NOT NULL` (drop the DEFAULT) + `REFERENCES users(id) ON DELETE CASCADE`.
  - in handlers/services, **return 401 explicitly** when `authctx.UserIDFrom` fails (never write an empty string).
- **Work unit**: migration file + audit each gateway's INSERT path. Cross-check in the router that the route is auth-protected.

### 🟡 P2-2. Errors are **swallowed**

- **Location**: many gateways — `log.Printf(...)` then a blanket `return apperrors.ErrInternalServer`.
  Also `client.go`'s `jsonScan`/`jsonMarshal` ignore `json.Unmarshal` errors via `//nolint:errcheck`.
- **Problem**: cause context is lost. P0-1 too "just logged and kept going," so the user just saw a broken screen.
- **Direction**: wrap with `fmt.Errorf("setup ensureRow: %w", err)` and propagate; log once at the handler boundary.
  Map domain-meaningful errors (duplicate email, etc.) to `apperrors` sentinels.
- **Work unit**: tidy a common gateway pattern (good to split into several small PRs).

---

### 🔵 P3-1. `CLAUDE.md` doc drift — misleads future Claude Code

The code and `CLAUDE.md` had diverged. **It's P3 but high-impact because it's the starting point for future development.**
*(Already fixed during this review — listed here for the record.)*

| CLAUDE.md said | Reality |
|----------------|---------|
| flat `handler/` files + shared `handler/dto/` | per-domain packages `handler/<x>/{handler,dto}.go` |
| DI wiring in `cmd/server/main.go` | actually `internal/server/router.go:newRouter` (143 lines, routing + assembly mixed) |
| "postgres only implements `AttemptGateway`" | all 8 domains are implemented in postgres |
| "Schedule/LearningAlarm are in-memory, lost on restart" | moved to the DB (`alarms`/`exams`/…) |
| `docs/voro_api_design.md` (target spec) | **does not exist on main** |

- **Direction**: keep `CLAUDE.md` in sync with the current structure — especially the "Adding a domain" steps and the wiring location.

### 🔵 P3-2. The composition root is mixed into the router

- **Location**: `internal/server/router.go:newRouter` — builds 8 sets of gateway→service→handler **and** registers routes in one function.
- **Direction**: extract assembly into `internal/server/app.go` (or `wire.go`); the router only takes handlers and maps paths.
  (`main.go` being a short 36 lines is nice, but assembly has crept into the router.)

### 🔵 P3-3. No gateway integration tests

- **Status**: tests are `service/{attempt,auth,quiz,setup}` units + 1 `e2e`. **0 postgres gateway integration tests.**
  → "schema vs query mismatches" like P0-1 aren't caught automatically.
- **Direction**: per-gateway tests run via `go test -tags e2e` (esp. one CRUD round-trip after migrations apply).
  The `TEST_DATABASE_URL` convention already exists.

---

## 3. Frontend notes (reference; outside backend scope)

- `src/types/*` **hand-mirror** the backend DTOs → manual sync needed when the backend changes (drift risk).
  Consider OpenAPI/codegen long-term.
- Some localStorage usage remains in `src/lib/{storage,auth}.ts` — review alongside the mock→API migration noted in CLAUDE.md.
- Routing/page separation (`routes/` shell + `pages/` impl) follows the convention well.

---

## 4. Recommended order (roadmap)

> Principle: **data integrity → security → robustness → docs.** Split each step into its own PR.

1. **P0-2 adopt a migration tool** + consolidate the final schema in `0001_init.sql` → **auto-resolves P0-1**.
   (If urgent, first put out the fire with `make db-reset` + the P0-1 hotfix, then move straight to P0-2.)
2. **P1-1 bcrypt** swap.
3. **P1-2 remove dynamic SQL** (setup.MarkStep).
4. **P2-1 user_id NOT NULL + FK**, **P2-2 error wrapping**.
5. **P3-1 update CLAUDE.md**, **P3-2 extract assembly**, **P3-3 gateway integration tests**.

Each item lists its **location (file:line) · root cause · direction · acceptance criteria · work unit** above,
so you can point a future Claude Code session at an item by number (e.g. "do P1-1") and it can start immediately.

---

## Appendix A. Put out the fire (dev environment)

```bash
make db-reset          # recreate the dev DB → clean latest schema incl. setup
make server            # confirm the 42703 errors are gone
```
If you have production/persistent data, apply the P0-1 `ALTER` as a migration instead of `make db-reset`.
