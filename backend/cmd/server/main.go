package main

import (
	"log"
	"net/http"
	"os"

	"voro/backend/internal/gateway/postgres"
	"voro/backend/internal/server"
)

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://voro:voro@localhost:5433/voro?sslmode=disable"
	}

	db, err := postgres.Open(dsn)
	if err != nil {
		log.Fatalf("DB 연결 실패: %v", err)
	}
	defer db.Close()

	if err := postgres.ApplyMigrations(db); err != nil {
		log.Fatalf("마이그레이션 실패: %v", err)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("server starting on :%s", port)
	if err := http.ListenAndServe(":"+port, server.NewHandler(db, os.Getenv("ALLOWED_ORIGIN"))); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
