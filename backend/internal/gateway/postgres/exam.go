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

func (g *ExamGateway) List() ([]domain.Exam, error) {
	rows, err := g.db.Query(`SELECT id, class_name, year, month, day, hour, minute, period, enabled FROM exams ORDER BY year, month, day`)
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

func (g *ExamGateway) ReplaceAll(exams []domain.Exam) ([]domain.Exam, error) {
	tx, err := g.db.Begin()
	if err != nil {
		log.Printf("exam ReplaceAll begin tx: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM exams`); err != nil {
		log.Printf("exam ReplaceAll delete: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	for _, e := range exams {
		if _, err := tx.Exec(
			`INSERT INTO exams(id, class_name, year, month, day, hour, minute, period, enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
			e.ID, e.ClassName, e.Year, e.Month, e.Day, e.Hour, e.Minute, e.Period, e.Enabled,
		); err != nil {
			log.Printf("exam ReplaceAll insert: %v", err)
			return nil, apperrors.ErrInternalServer
		}
	}
	if err := tx.Commit(); err != nil {
		log.Printf("exam ReplaceAll commit: %v", err)
		return nil, apperrors.ErrInternalServer
	}
	return g.List()
}

func (g *ExamGateway) GetMaster() (bool, error) {
	var enabled bool
	if err := g.db.QueryRow(`SELECT enabled FROM exam_master WHERE id=1`).Scan(&enabled); err != nil {
		log.Printf("exam GetMaster: %v", err)
		return false, apperrors.ErrInternalServer
	}
	return enabled, nil
}

func (g *ExamGateway) SetMaster(enabled bool) error {
	if _, err := g.db.Exec(`UPDATE exam_master SET enabled=$1 WHERE id=1`, enabled); err != nil {
		log.Printf("exam SetMaster: %v", err)
		return apperrors.ErrInternalServer
	}
	return nil
}
