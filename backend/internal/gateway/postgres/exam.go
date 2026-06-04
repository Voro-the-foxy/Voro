package postgres

import (
	"database/sql"
	"log"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

type ExamGateway struct {
	db *sql.DB
}

func NewExamGateway(db *sql.DB) *ExamGateway {
	return &ExamGateway{db: db}
}

func (g *ExamGateway) List(userID string) ([]domain.Exam, error) {
	rows, err := g.db.Query(`SELECT id, class_name, year, month, day, hour, minute, period, enabled FROM exams WHERE user_id=$1 ORDER BY year, month, day`, userID)
	if err != nil {
		log.Printf("exam List: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer rows.Close()

	var out []domain.Exam
	for rows.Next() {
		var e domain.Exam
		if err := rows.Scan(&e.ID, &e.ClassName, &e.Year, &e.Month, &e.Day, &e.Hour, &e.Minute, &e.Period, &e.Enabled); err != nil {
			log.Printf("exam List scan: %v", err)
			continue
		}
		out = append(out, e)
	}
	if out == nil {
		out = []domain.Exam{}
	}
	return out, nil
}

func (g *ExamGateway) ReplaceAll(userID string, exams []domain.Exam) ([]domain.Exam, error) {
	tx, err := g.db.Begin()
	if err != nil {
		log.Printf("exam ReplaceAll begin tx: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM exams WHERE user_id=$1`, userID); err != nil {
		log.Printf("exam ReplaceAll delete: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	for _, e := range exams {
		if _, err := tx.Exec(
			`INSERT INTO exams(id, user_id, class_name, year, month, day, hour, minute, period, enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
			e.ID, userID, e.ClassName, e.Year, e.Month, e.Day, e.Hour, e.Minute, e.Period, e.Enabled,
		); err != nil {
			log.Printf("exam ReplaceAll insert: %v", err)
			return nil, apperrors.ErrInternalServer
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("exam ReplaceAll commit: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	return g.List(userID)
}

func (g *ExamGateway) GetMaster(userID string) (bool, error) {
	var enabled bool
	err := g.db.QueryRow(`SELECT enabled FROM exam_master WHERE user_id=$1`, userID).Scan(&enabled)
	if err == sql.ErrNoRows {
		return true, nil // default: enabled until the user changes it
	}
	if err != nil {
		log.Printf("exam GetMaster: %v", err)
		return false, apperrors.ErrInternalServer
	}
	return enabled, nil
}

func (g *ExamGateway) SetMaster(userID string, enabled bool) error {
	if _, err := g.db.Exec(
		`INSERT INTO exam_master(user_id, enabled) VALUES($1,$2)
		 ON CONFLICT(user_id) DO UPDATE SET enabled=$2`,
		userID, enabled,
	); err != nil {
		log.Printf("exam SetMaster: %v", err)
		return apperrors.ErrInternalServer
	}
	return nil
}
