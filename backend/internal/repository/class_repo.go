package repository

import (
	"database/sql"

	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/shared/errors"
)

type ClassRepository struct {
	db *sql.DB
}

func NewClassRepository(db *sql.DB) *ClassRepository {
	return &ClassRepository{db: db}
}

func (r *ClassRepository) List() []domain.ClassItem {
	rows, err := r.db.Query(`SELECT id, name, slots FROM classes ORDER BY name`)
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

func (r *ClassRepository) ReplaceAll(classes []domain.ClassItem) []domain.ClassItem {
	tx, err := r.db.Begin()
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
		tx.Exec(`INSERT INTO classes(id, name, slots) VALUES($1,$2,$3)`,
			c.ID, c.Name, jsonMarshal(c.Slots))
	}
	tx.Commit()
	return r.List()
}

func (r *ClassRepository) Add(c domain.ClassItem) domain.ClassItem {
	if c.Slots == nil {
		c.Slots = []string{}
	}
	r.db.Exec(`INSERT INTO classes(id, name, slots) VALUES($1,$2,$3)`,
		c.ID, c.Name, jsonMarshal(c.Slots))
	return c
}

func (r *ClassRepository) Delete(id string) error {
	res, err := r.db.Exec(`DELETE FROM classes WHERE id=$1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return errors.ErrNotFound
	}
	return nil
}
