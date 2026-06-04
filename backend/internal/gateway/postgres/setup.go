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

// ensureRow creates the per-user setup row on first access so Get/MarkStep can
// assume it exists.
func (g *SetupGateway) ensureRow(userID string) error {
	if _, err := g.db.Exec(`INSERT INTO setup(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING`, userID); err != nil {
		log.Printf("setup ensureRow: %v", err)
		return apperrors.ErrInternalServer
	}
	return nil
}

func (g *SetupGateway) Get(userID string) (domain.SetupState, error) {
	if err := g.ensureRow(userID); err != nil {
		return domain.SetupState{}, err
	}
	var s domain.SetupState
	if err := g.db.QueryRow(`SELECT schedule, alarm, exam, notes FROM setup WHERE user_id=$1`, userID).
		Scan(&s.Schedule, &s.Alarm, &s.Exam, &s.Notes); err != nil {
		log.Printf("setup Get: %v", err)
		return domain.SetupState{}, apperrors.ErrInternalServer
	}
	return s, nil
}

func (g *SetupGateway) MarkStep(userID, step string) (domain.SetupState, error) {
	if err := g.ensureRow(userID); err != nil {
		return domain.SetupState{}, err
	}
	// step is validated against an allowlist in the service layer before reaching here.
	if _, err := g.db.Exec(`UPDATE setup SET `+step+`=true WHERE user_id=$1`, userID); err != nil {
		log.Printf("setup MarkStep %s: %v", step, err)
		return domain.SetupState{}, apperrors.ErrInternalServer
	}
	return g.Get(userID)
}
