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

func (g *NoteGateway) ListByClass(userID, classID string) ([]domain.Note, error) {
	var rows *sql.Rows
	var err error
	if classID == "" {
		rows, err = g.db.Query(`SELECT id, class_id, filename, size, added_at, document_id FROM notes WHERE user_id=$1 ORDER BY added_at DESC`, userID)
	} else {
		rows, err = g.db.Query(`SELECT id, class_id, filename, size, added_at, document_id FROM notes WHERE user_id=$1 AND class_id=$2 ORDER BY added_at DESC`, userID, classID)
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

func (g *NoteGateway) Add(userID string, n domain.Note) (domain.Note, error) {
	if _, err := g.db.Exec(
		`INSERT INTO notes(id, user_id, class_id, filename, size, added_at, document_id) VALUES($1,$2,$3,$4,$5,$6,$7)`,
		n.ID, userID, n.ClassID, n.Filename, n.Size, n.AddedAt, n.DocumentID,
	); err != nil {
		log.Printf("note Add: %v", err)
		return domain.Note{}, apperrors.ErrInternalServer
	}
	return n, nil
}

func (g *NoteGateway) Delete(userID, id string) error {
	res, err := g.db.Exec(`DELETE FROM notes WHERE id=$1 AND user_id=$2`, id, userID)
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

func (g *NoteGateway) DeleteByClass(userID, classID string) error {
	if _, err := g.db.Exec(`DELETE FROM notes WHERE user_id=$1 AND class_id=$2`, userID, classID); err != nil {
		log.Printf("note DeleteByClass: %v", err)
		return apperrors.ErrInternalServer
	}
	return nil
}
