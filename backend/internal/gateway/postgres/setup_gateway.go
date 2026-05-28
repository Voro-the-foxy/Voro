package postgres

import (
	"database/sql"

	"nomilk/backend/internal/domain"
)

type SetupGateway struct {
	db *sql.DB
}

func NewSetupGateway(db *sql.DB) *SetupGateway {
	return &SetupGateway{db: db}
}

func (g *SetupGateway) Get() domain.SetupState {
	var s domain.SetupState
	g.db.QueryRow(`SELECT schedule, alarm, exam, notes FROM setup WHERE id=1`).Scan(&s.Schedule, &s.Alarm, &s.Exam, &s.Notes)
	return s
}

func (g *SetupGateway) MarkStep(step string) domain.SetupState {
	switch step {
	case "schedule":
		g.db.Exec(`UPDATE setup SET schedule=true WHERE id=1`)
	case "alarm":
		g.db.Exec(`UPDATE setup SET alarm=true WHERE id=1`)
	case "exam":
		g.db.Exec(`UPDATE setup SET exam=true WHERE id=1`)
	case "notes":
		g.db.Exec(`UPDATE setup SET notes=true WHERE id=1`)
	}
	return g.Get()
}
