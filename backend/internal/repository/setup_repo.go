package repository

import (
	"database/sql"

	"nomilk/backend/internal/domain"
)

type SetupRepository struct {
	db *sql.DB
}

func NewSetupRepository(db *sql.DB) *SetupRepository {
	return &SetupRepository{db: db}
}

func (r *SetupRepository) Get() domain.SetupState {
	var s domain.SetupState
	r.db.QueryRow(`SELECT schedule, alarm, exam, notes FROM setup WHERE id=1`).Scan(&s.Schedule, &s.Alarm, &s.Exam, &s.Notes)
	return s
}

func (r *SetupRepository) MarkStep(step string) domain.SetupState {
	switch step {
	case "schedule":
		r.db.Exec(`UPDATE setup SET schedule=true WHERE id=1`)
	case "alarm":
		r.db.Exec(`UPDATE setup SET alarm=true WHERE id=1`)
	case "exam":
		r.db.Exec(`UPDATE setup SET exam=true WHERE id=1`)
	case "notes":
		r.db.Exec(`UPDATE setup SET notes=true WHERE id=1`)
	}
	return r.Get()
}
