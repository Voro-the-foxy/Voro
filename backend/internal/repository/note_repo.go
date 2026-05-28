package repository

import (
	"database/sql"

	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/shared/errors"
)

type NoteRepository struct {
	db *sql.DB
}

func NewNoteRepository(db *sql.DB) *NoteRepository {
	return &NoteRepository{db: db}
}

func (r *NoteRepository) ListByClass(classID string) []domain.Note {
	var rows *sql.Rows
	var err error
	if classID == "" {
		rows, err = r.db.Query(`SELECT id, class_id, filename, size, added_at, document_id FROM notes ORDER BY added_at DESC`)
	} else {
		rows, err = r.db.Query(`SELECT id, class_id, filename, size, added_at, document_id FROM notes WHERE class_id=$1 ORDER BY added_at DESC`, classID)
	}
	if err != nil {
		return []domain.Note{}
	}
	defer rows.Close()

	var out []domain.Note
	for rows.Next() {
		var n domain.Note
		if err := rows.Scan(&n.ID, &n.ClassID, &n.Filename, &n.Size, &n.AddedAt, &n.DocumentID); err != nil {
			continue
		}
		out = append(out, n)
	}
	if out == nil {
		out = []domain.Note{}
	}
	return out
}

func (r *NoteRepository) Add(n domain.Note) domain.Note {
	r.db.Exec(`INSERT INTO notes(id, class_id, filename, size, added_at, document_id) VALUES($1,$2,$3,$4,$5,$6)`,
		n.ID, n.ClassID, n.Filename, n.Size, n.AddedAt, n.DocumentID)
	return n
}

func (r *NoteRepository) Delete(id string) error {
	res, err := r.db.Exec(`DELETE FROM notes WHERE id=$1`, id)
	if err != nil {
		return err
	}
	count, _ := res.RowsAffected()
	if count == 0 {
		return errors.ErrNotFound
	}
	return nil
}

func (r *NoteRepository) DeleteByClass(classID string) {
	r.db.Exec(`DELETE FROM notes WHERE class_id=$1`, classID)
}
