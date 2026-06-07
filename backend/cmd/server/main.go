// Package main is the entry point for the Voro API server.
//
//	@title			Voro API
//	@version		1.0
//	@description	Voro study management app backend API
//
//	@contact.name	Voro Team
//
//	@host		voro-production-405e.up.railway.app
//	@BasePath	/
//	@schemes	https
//
//	@securityDefinitions.apikey	BearerAuth
//	@in							header
//	@name						Authorization
//	@description				Format: Bearer {token}
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
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer db.Close()

	if err := postgres.ApplyMigrations(db); err != nil {
		log.Fatalf("failed to apply migrations: %v", err)
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
