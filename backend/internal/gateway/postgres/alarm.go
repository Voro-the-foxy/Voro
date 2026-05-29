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

func (g *AlarmGateway) List() ([]domain.Alarm, error) {
	rows, err := g.db.Query(`SELECT id, hour, minute, period, days, enabled FROM alarms ORDER BY hour, minute`)
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

func (g *AlarmGateway) ReplaceAll(alarms []domain.Alarm) ([]domain.Alarm, error) {
	tx, err := g.db.Begin()
	if err != nil {
		log.Printf("alarm ReplaceAll begin tx: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM alarms`); err != nil {
		log.Printf("alarm ReplaceAll delete: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	for _, a := range alarms {
		if a.Days == nil {
			a.Days = []string{}
		}
		if _, err := tx.Exec(
			`INSERT INTO alarms(id, hour, minute, period, days, enabled) VALUES($1,$2,$3,$4,$5,$6)`,
			a.ID, a.Hour, a.Minute, a.Period, jsonMarshal(a.Days), a.Enabled,
		); err != nil {
			log.Printf("alarm ReplaceAll insert: %v", err)
			return nil, apperrors.ErrInternalServer
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("alarm ReplaceAll commit: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	return g.List()
}

func (g *AlarmGateway) GetMaster() (bool, error) {
	var enabled bool
	if err := g.db.QueryRow(`SELECT enabled FROM alarm_master WHERE id=1`).Scan(&enabled); err != nil {
		log.Printf("alarm GetMaster: %v", err)
		return false, apperrors.ErrInternalServer
	}
	return enabled, nil
}

func (g *AlarmGateway) SetMaster(enabled bool) error {
	if _, err := g.db.Exec(`UPDATE alarm_master SET enabled=$1 WHERE id=1`, enabled); err != nil {
		log.Printf("alarm SetMaster: %v", err)
		return apperrors.ErrInternalServer
	}
	return nil
}
