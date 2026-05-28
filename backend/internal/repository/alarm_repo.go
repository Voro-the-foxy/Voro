package repository

import (
	"database/sql"

	"nomilk/backend/internal/domain"
)

type AlarmRepository struct {
	db *sql.DB
}

func NewAlarmRepository(db *sql.DB) *AlarmRepository {
	return &AlarmRepository{db: db}
}

func (r *AlarmRepository) List() []domain.Alarm {
	rows, err := r.db.Query(`SELECT id, hour, minute, period, days, enabled FROM alarms ORDER BY hour, minute`)
	if err != nil {
		return []domain.Alarm{}
	}
	defer rows.Close()

	var out []domain.Alarm
	for rows.Next() {
		var a domain.Alarm
		var daysJSON []byte
		if err := rows.Scan(&a.ID, &a.Hour, &a.Minute, &a.Period, &daysJSON, &a.Enabled); err != nil {
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
	return out
}

func (r *AlarmRepository) ReplaceAll(alarms []domain.Alarm) []domain.Alarm {
	tx, err := r.db.Begin()
	if err != nil {
		return alarms
	}
	defer tx.Rollback()

	tx.Exec(`DELETE FROM alarms`)
	for _, a := range alarms {
		if a.Days == nil {
			a.Days = []string{}
		}
		tx.Exec(`INSERT INTO alarms(id, hour, minute, period, days, enabled) VALUES($1,$2,$3,$4,$5,$6)`,
			a.ID, a.Hour, a.Minute, a.Period, jsonMarshal(a.Days), a.Enabled)
	}
	tx.Commit()
	return r.List()
}

func (r *AlarmRepository) GetMaster() bool {
	var enabled bool
	r.db.QueryRow(`SELECT enabled FROM alarm_master WHERE id=1`).Scan(&enabled)
	return enabled
}

func (r *AlarmRepository) SetMaster(enabled bool) {
	r.db.Exec(`UPDATE alarm_master SET enabled=$1 WHERE id=1`, enabled)
}
