.PHONY: backend-run backend-build frontend-dev frontend-build frontend-install

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
