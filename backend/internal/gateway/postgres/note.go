package postgres

import (
	"database/sql"
	"log"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

type NoteGateway struct {
	db *sql.DB
}

func NewNoteGateway(db *sql.DB) *NoteGateway {
	return &NoteGateway{db: db}
}

func (g *NoteGateway) ListByClass(classID string) ([]domain.Note, error) {
	var rows *sql.Rows
	var err error
	if classID == "" {
		rows, err = g.db.Query(`SELECT id, class_id, filename, size, added_at, document_id FROM notes ORDER BY added_at DESC`)
	} else {
		rows, err = g.db.Query(`SELECT id, class_id, filename, size, added_at, document_id FROM notes WHERE class_id=$1 ORDER BY added_at DESC`, classID)
	}
	if err != nil {
		log.Printf("note ListByClass: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer rows.Close()

	var out []domain.Note
	for rows.Next() {
		var n domain.Note
		if err := rows.Scan(&n.ID, &n.ClassID, &n.Filename, &n.Size, &n.AddedAt, &n.DocumentID); err != nil {
			log.Printf("note ListByClass scan: %v", err)
			continue
		}
		out = append(out, n)
	}
	if out == nil {
		out = []domain.Note{}
	}
	return out, nil
}

func (g *NoteGateway) Add(n domain.Note) (domain.Note, error) {
	if _, err := g.db.Exec(
		`INSERT INTO notes(id, class_id, filename, size, added_at, document_id) VALUES($1,$2,$3,$4,$5,$6)`,
		n.ID, n.ClassID, n.Filename, n.Size, n.AddedAt, n.DocumentID,
	); err != nil {
		log.Printf("note Add: %v", err)
		return domain.Note{}, apperrors.ErrInternalServer
	}
	return n, nil
}

func (g *NoteGateway) Delete(id string) error {
	res, err := g.db.Exec(`DELETE FROM notes WHERE id=$1`, id)
	if err != nil {
		log.Printf("note Delete: %v", err)
		return apperrors.ErrInternalServer
	}
	count, _ := res.RowsAffected()
	if count == 0 {
		return apperrors.ErrNotFound
	}
	return nil
}

func (g *NoteGateway) DeleteByClass(classID string) error {
	if _, err := g.db.Exec(`DELETE FROM notes WHERE class_id=$1`, classID); err != nil {
		log.Printf("note DeleteByClass: %v", err)
		return apperrors.ErrInternalServer
	}
	return nil
}
