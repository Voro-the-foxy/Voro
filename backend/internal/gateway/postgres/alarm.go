package postgres

import (
	"database/sql"
	"log"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

type AlarmGateway struct {
	db *sql.DB
}

func NewAlarmGateway(db *sql.DB) *AlarmGateway {
	return &AlarmGateway{db: db}
}

func (g *AlarmGateway) List(userID string) ([]domain.Alarm, error) {
	rows, err := g.db.Query(`SELECT id, hour, minute, period, days, enabled FROM alarms WHERE user_id=$1 ORDER BY hour, minute`, userID)
	if err != nil {
		log.Printf("alarm List: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer rows.Close()

	var out []domain.Alarm
	for rows.Next() {
		var a domain.Alarm
		var daysJSON []byte
		if err := rows.Scan(&a.ID, &a.Hour, &a.Minute, &a.Period, &daysJSON, &a.Enabled); err != nil {
			log.Printf("alarm List scan: %v", err)
			continue
		}
		jsonScan(daysJSON, &a.Days)
		if a.Days == nil {
			a.Days = []string{}
		}
		out = append(out, a)
	}
	if out == nil {
		out = []domain.Alarm{}
	}
	return out, nil
}

func (g *AlarmGateway) ReplaceAll(userID string, alarms []domain.Alarm) ([]domain.Alarm, error) {
	tx, err := g.db.Begin()
	if err != nil {
		log.Printf("alarm ReplaceAll begin tx: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM alarms WHERE user_id=$1`, userID); err != nil {
		log.Printf("alarm ReplaceAll delete: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	for _, a := range alarms {
		if a.Days == nil {
			a.Days = []string{}
		}
		if _, err := tx.Exec(
			`INSERT INTO alarms(id, user_id, hour, minute, period, days, enabled) VALUES($1,$2,$3,$4,$5,$6,$7)`,
			a.ID, userID, a.Hour, a.Minute, a.Period, jsonMarshal(a.Days), a.Enabled,
		); err != nil {
			log.Printf("alarm ReplaceAll insert: %v", err)
			return nil, apperrors.ErrInternalServer
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("alarm ReplaceAll commit: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	return g.List(userID)
}

func (g *AlarmGateway) GetMaster(userID string) (bool, error) {
	var enabled bool
	err := g.db.QueryRow(`SELECT enabled FROM alarm_master WHERE user_id=$1`, userID).Scan(&enabled)
	if err == sql.ErrNoRows {
		return true, nil // default: enabled until the user changes it
	}
	if err != nil {
		log.Printf("alarm GetMaster: %v", err)
		return false, apperrors.ErrInternalServer
	}
	return enabled, nil
}

func (g *AlarmGateway) SetMaster(userID string, enabled bool) error {
	if _, err := g.db.Exec(
		`INSERT INTO alarm_master(user_id, enabled) VALUES($1,$2)
		 ON CONFLICT(user_id) DO UPDATE SET enabled=$2`,
		userID, enabled,
	); err != nil {
		log.Printf("alarm SetMaster: %v", err)
		return apperrors.ErrInternalServer
	}
	return nil
}
