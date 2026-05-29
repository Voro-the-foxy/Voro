package postgres

import (
	"database/sql"
	"log"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

type ClassGateway struct {
	db *sql.DB
}

func NewClassGateway(db *sql.DB) *ClassGateway {
	return &ClassGateway{db: db}
}

func (g *ClassGateway) List() ([]domain.ClassItem, error) {
	rows, err := g.db.Query(`SELECT id, name, slots FROM classes ORDER BY name`)
	if err != nil {
		log.Printf("class List: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer rows.Close()

	var out []domain.ClassItem
	for rows.Next() {
		var c domain.ClassItem
		var slotsJSON []byte
		if err := rows.Scan(&c.ID, &c.Name, &slotsJSON); err != nil {
			log.Printf("class List scan: %v", err)
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
	return out, nil
}

func (g *ClassGateway) ReplaceAll(classes []domain.ClassItem) ([]domain.ClassItem, error) {
	tx, err := g.db.Begin()
	if err != nil {
		log.Printf("class ReplaceAll begin tx: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM classes`); err != nil {
		log.Printf("class ReplaceAll delete: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	for _, c := range classes {
		if c.Slots == nil {
			c.Slots = []string{}
		}
		if _, err := tx.Exec(`INSERT INTO classes(id, name, slots) VALUES($1,$2,$3)`,
			c.ID, c.Name, jsonMarshal(c.Slots)); err != nil {
			log.Printf("class ReplaceAll insert: %v", err)
			return nil, apperrors.ErrInternalServer
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("class ReplaceAll commit: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	return g.List()
}

func (g *ClassGateway) Add(c domain.ClassItem) (domain.ClassItem, error) {
	if c.Slots == nil {
		c.Slots = []string{}
	}
	if _, err := g.db.Exec(`INSERT INTO classes(id, name, slots) VALUES($1,$2,$3)`,
		c.ID, c.Name, jsonMarshal(c.Slots)); err != nil {
		log.Printf("class Add: %v", err)
		return domain.ClassItem{}, apperrors.ErrInternalServer
	}
	return c, nil
}

func (g *ClassGateway) Delete(id string) error {
	res, err := g.db.Exec(`DELETE FROM classes WHERE id=$1`, id)
	if err != nil {
		log.Printf("class Delete: %v", err)
		return apperrors.ErrInternalServer
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}
