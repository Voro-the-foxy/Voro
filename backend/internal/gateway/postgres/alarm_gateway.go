package postgres

import (
	"database/sql"

	"nomilk/backend/internal/domain"
)

type AlarmGateway struct {
	db *sql.DB
}

func NewAlarmGateway(db *sql.DB) *AlarmGateway {
	return &AlarmGateway{db: db}
}

func (g *AlarmGateway) List() []domain.Alarm {
	rows, err := g.db.Query(`SELECT id, hour, minute, period, days, enabled FROM alarms ORDER BY hour, minute`)
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

func (g *AlarmGateway) ReplaceAll(alarms []domain.Alarm) []domain.Alarm {
	tx, err := g.db.Begin()
	if err != nil {
		return alarms
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM alarms`); err != nil {
		return alarms
	}
	for _, a := range alarms {
		if a.Days == nil {
			a.Days = []string{}
		}
		if _, err := tx.Exec(`INSERT INTO alarms(id, hour, minute, period, days, enabled) VALUES($1,$2,$3,$4,$5,$6)`,
			a.ID, a.Hour, a.Minute, a.Period, jsonMarshal(a.Days), a.Enabled); err != nil {
			return alarms
		}
	}
	tx.Commit()
	return g.List()
}

func (g *AlarmGateway) GetMaster() bool {
	var enabled bool
	g.db.QueryRow(`SELECT enabled FROM alarm_master WHERE id=1`).Scan(&enabled)
	return enabled
}

func (g *AlarmGateway) SetMaster(enabled bool) {
	g.db.Exec(`UPDATE alarm_master SET enabled=$1 WHERE id=1`, enabled)
}
