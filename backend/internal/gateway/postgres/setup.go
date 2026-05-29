package postgres

import (
	"database/sql"
	"log"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

type SetupGateway struct {
	db *sql.DB
}

func NewSetupGateway(db *sql.DB) *SetupGateway {
	return &SetupGateway{db: db}
}

func (g *SetupGateway) Get() (domain.SetupState, error) {
	var s domain.SetupState
	if err := g.db.QueryRow(`SELECT schedule, alarm, exam, notes FROM setup WHERE id=1`).
		Scan(&s.Schedule, &s.Alarm, &s.Exam, &s.Notes); err != nil {
		log.Printf("setup Get: %v", err)
		return domain.SetupState{}, apperrors.ErrInternalServer
	}
	return s, nil
}

func (g *SetupGateway) MarkStep(step string) (domain.SetupState, error) {
	if _, err := g.db.Exec(`UPDATE setup SET `+step+`=true WHERE id=1`); err != nil {
		log.Printf("setup MarkStep %s: %v", step, err)
		return domain.SetupState{}, apperrors.ErrInternalServer
	}
	return g.Get()
}
