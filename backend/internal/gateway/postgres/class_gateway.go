package postgres

import (
	"database/sql"

	"nomilk/backend/internal/domain"
	apperrors "nomilk/backend/internal/shared/errors"
)

type ClassGateway struct {
	db *sql.DB
}

func NewClassGateway(db *sql.DB) *ClassGateway {
	return &ClassGateway{db: db}
}

func (g *ClassGateway) List() []domain.ClassItem {
	rows, err := g.db.Query(`SELECT id, name, slots FROM classes ORDER BY name`)
	if err != nil {
		return []domain.ClassItem{}
	}
	defer rows.Close()

	var out []domain.ClassItem
	for rows.Next() {
		var c domain.ClassItem
		var slotsJSON []byte
		if err := rows.Scan(&c.ID, &c.Name, &slotsJSON); err != nil {
			continue
		}
		jsonScan(slotsJSON, &c.Slots)
		if c.Slots == nil {
			c.Slots = []string{}
		}
		out = append(out, c)
	}
	if out == nil {
		out = []domain.ClassItem{}
	}
	return out
}

func (g *ClassGateway) ReplaceAll(classes []domain.ClassItem) []domain.ClassItem {
	tx, err := g.db.Begin()
	if err != nil {
		return classes
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM classes`); err != nil {
		return classes
	}
	for _, c := range classes {
		if c.Slots == nil {
			c.Slots = []string{}
		}
		if _, err := tx.Exec(`INSERT INTO classes(id, name, slots) VALUES($1,$2,$3)`,
			c.ID, c.Name, jsonMarshal(c.Slots)); err != nil {
			return classes
		}
	}
	tx.Commit()
	return g.List()
}

func (g *ClassGateway) Add(c domain.ClassItem) domain.ClassItem {
	if c.Slots == nil {
		c.Slots = []string{}
	}
	g.db.Exec(`INSERT INTO classes(id, name, slots) VALUES($1,$2,$3)`,
		c.ID, c.Name, jsonMarshal(c.Slots))
	return c
}

func (g *ClassGateway) Delete(id string) error {
	res, err := g.db.Exec(`DELETE FROM classes WHERE id=$1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}
