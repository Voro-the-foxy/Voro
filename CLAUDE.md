# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two sibling projects driven from a top-level `Makefile`:

- `backend/` — Go 1.22 HTTP API (module path `nomilk/backend`). Entry point: `backend/cmd/server/main.go`. Listens on `:8080`.
- `frontend/` — Vite + React 19 + TypeScript SPA using TanStack Router and Tailwind CSS 4. Dev server runs on `:5173`.

The backend hardcodes a CORS allowlist for `http://localhost:5173` — the frontend dev server must run on that port for API calls to work.

## Common commands

From the repo root (`Makefile`):

- `make backend-run` — run the Go server (`go run ./cmd/server`)
- `make backend-build` — build to `backend/bin/server`
- `make frontend-install` — `npm install` inside `frontend/`
- `make frontend-dev` — installs deps, then `npm run dev`
- `make frontend-build` — installs deps, then `tsc -b && vite build`

Frontend-only scripts (run inside `frontend/`):

- `npm run lint` — ESLint across the project (flat config in `eslint.config.js`)
- `npm run preview` — preview production build

There is no Go test suite or lint command wired up yet; `go test ./...` from `backend/` is the entry point when tests are added.

## Backend architecture

Layered, manually DI-wired per domain. A new domain is added by creating files in each layer and then assembling them in `main.go`:

```
handler  ──uses──▶  service  ──uses──▶  repository  ──reads──▶  mockdata
   │                                                               │
   └── dto (JSON shape)                          domain (core types)
```

- `internal/domain/` — plain structs (e.g. `Place`, `Product`); no tags, no transport concerns.
- `internal/repository/` — data access. Currently backed by in-memory slices in `internal/mockdata/`. Returns `*errors.AppError` sentinels (e.g. `ErrNotFound`) instead of raw `errors.New`.
- `internal/service/` — business logic; holds a pointer to its repository (e.g. `PlaceService{Repo: *PlaceRepository}`).
- `internal/handler/` — HTTP handlers; holds a pointer to its service and maps `domain.*` → `dto.*` before writing JSON.
- `internal/handler/dto/` — JSON-tagged transport structs. Keep these separate from `domain/`.
- `internal/shared/errors/` — `AppError{Code, Message}` with predefined sentinels (`ErrNotFound`, `ErrInvalidRequest`, `ErrUnauthorized`, `ErrInternalServer`). Messages are Korean.

Routing uses Go 1.22's method-prefixed `http.ServeMux` patterns (e.g. `"GET /api/stores"`). Note the current `main.go` has two wiring blocks — `setupRouter()` assembles both Place and Product domains, but `main()` presently builds its own `mux` with only the Place route and ignores `setupRouter()`. Product routes exist but are not served until `main()` is switched to use `setupRouter()`.

## Frontend architecture

- Entry: `src/main.tsx` → `src/router.tsx` → `RouterProvider` with generated `routeTree.gen.ts`.
- **TanStack Router file-based routing**: `src/routes/*.tsx` files define routes via `createFileRoute` / `createRootRoute`. `routeTree.gen.ts` is **auto-generated** by `@tanstack/router-plugin/vite` (configured in `vite.config.ts` with `autoCodeSplitting: true`) — do not edit it by hand; it regenerates on `vite dev` / `vite build`.
- `src/routes/__root.tsx` wraps all pages in a fixed 375×812 "mobile phone" frame — the app is designed as a mobile-viewport SPA.
- Route files stay thin and delegate to page components in `src/pages/` (e.g. `routes/stores.tsx` → `pages/StoresPage.tsx`). Shared UI goes in `src/component/`, shared types in `src/types/`.
- Path alias `@` → `/src` (see `vite.config.ts`). Imports like `@/component/card` and `@/types/store` are the convention.
- Data fetching is currently raw `fetch` inside `useEffect` against `http://localhost:8080/api/...` (no client library, no env var). If the backend URL needs to change, it must be updated at each call site.
- Styling is Tailwind CSS v4 via `@tailwindcss/vite` — no `tailwind.config.js`, utilities work out of the box in JSX.

## Conventions to preserve

- Backend: keep the handler/service/repository/dto/domain split; do not leak JSON tags into `domain/`. Return `errors.ErrX` sentinels from repositories rather than ad-hoc errors.
- When adding a backend route, wire the full stack (`repo → service → handler`) in `main.go` next to the existing `placeHnd` / `productHnd` blocks.
- Frontend: add new pages as `src/routes/<name>.tsx` (route shell) + `src/pages/<Name>Page.tsx` (implementation) so the router plugin picks them up.
