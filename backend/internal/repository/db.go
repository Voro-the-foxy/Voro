package repository

import (
	"database/sql"
	"encoding/json"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func Open(dsn string) (*sql.DB, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping db: %w", err)
	}
	return db, nil
}

func ApplyMigrations(db *sql.DB) error {
	// Drop old AI-server-style attempts table if it exists with incompatible schema
	_, _ = db.Exec(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1 FROM information_schema.columns
				WHERE table_name = 'attempts' AND column_name = 'correct_count'
			) THEN
				DROP TABLE attempts;
			END IF;
		END $$;
	`)

	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id            TEXT PRIMARY KEY,
			email         TEXT UNIQUE NOT NULL,
			name          TEXT NOT NULL,
			password_hash TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sessions (
			token      TEXT PRIMARY KEY,
			user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE
		);

		CREATE TABLE IF NOT EXISTS classes (
			id    TEXT PRIMARY KEY,
			name  TEXT NOT NULL,
			slots JSONB NOT NULL DEFAULT '[]'
		);

		CREATE TABLE IF NOT EXISTS notes (
			id          TEXT PRIMARY KEY,
			class_id    TEXT NOT NULL,
			filename    TEXT NOT NULL,
			size        BIGINT NOT NULL,
			added_at    BIGINT NOT NULL,
			document_id TEXT NOT NULL DEFAULT ''
		);

		CREATE TABLE IF NOT EXISTS alarms (
			id      TEXT PRIMARY KEY,
			hour    INT NOT NULL,
			minute  INT NOT NULL,
			period  TEXT NOT NULL,
			days    JSONB NOT NULL DEFAULT '[]',
			enabled BOOLEAN NOT NULL DEFAULT true
		);

		CREATE TABLE IF NOT EXISTS alarm_master (
			id      INT PRIMARY KEY DEFAULT 1,
			enabled BOOLEAN NOT NULL DEFAULT true
		);
		INSERT INTO alarm_master(id, enabled) VALUES (1, true) ON CONFLICT DO NOTHING;

		CREATE TABLE IF NOT EXISTS exams (
			id         TEXT PRIMARY KEY,
			class_name TEXT NOT NULL,
			year       INT NOT NULL,
			month      INT NOT NULL,
			day        INT NOT NULL,
			hour       INT NOT NULL,
			minute     INT NOT NULL,
			period     TEXT NOT NULL,
			enabled    BOOLEAN NOT NULL DEFAULT true
		);

		CREATE TABLE IF NOT EXISTS exam_master (
			id      INT PRIMARY KEY DEFAULT 1,
			enabled BOOLEAN NOT NULL DEFAULT true
		);
		INSERT INTO exam_master(id, enabled) VALUES (1, true) ON CONFLICT DO NOTHING;

		CREATE TABLE IF NOT EXISTS setup (
			id       INT PRIMARY KEY DEFAULT 1,
			schedule BOOLEAN NOT NULL DEFAULT false,
			alarm    BOOLEAN NOT NULL DEFAULT false,
			exam     BOOLEAN NOT NULL DEFAULT false,
			notes    BOOLEAN NOT NULL DEFAULT false
		);
		INSERT INTO setup(id) VALUES (1) ON CONFLICT DO NOTHING;
		ALTER TABLE setup ADD COLUMN IF NOT EXISTS notes BOOLEAN NOT NULL DEFAULT false;

		CREATE TABLE IF NOT EXISTS attempts (
			id              TEXT PRIMARY KEY,
			class_id        TEXT NOT NULL,
			quiz_id         TEXT NOT NULL,
			lecture_title   TEXT NOT NULL,
			question_ids    JSONB NOT NULL DEFAULT '[]',
			answers         JSONB NOT NULL DEFAULT '[]',
			correct_indices JSONB NOT NULL DEFAULT '[]',
			score           INT NOT NULL DEFAULT 0,
			total           INT NOT NULL DEFAULT 0,
			completed_at    BIGINT NOT NULL DEFAULT 0
		);
	`)
	return err
}

// jsonMarshal is a helper to marshal a value to JSON bytes for JSONB columns.
func jsonMarshal(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

// jsonScan scans a JSONB column (returned as []byte) into a Go value.
func jsonScan(b []byte, dst any) {
	if b == nil {
		return
	}
	json.Unmarshal(b, dst) //nolint:errcheck
}
