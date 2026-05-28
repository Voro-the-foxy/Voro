package repository

import (
	"database/sql"

	"nomilk/backend/internal/domain"
)

type ExamRepository struct {
	db *sql.DB
}

func NewExamRepository(db *sql.DB) *ExamRepository {
	return &ExamRepository{db: db}
}

func (r *ExamRepository) List() []domain.Exam {
	rows, err := r.db.Query(`SELECT id, class_name, year, month, day, hour, minute, period, enabled FROM exams ORDER BY year, month, day`)
	if err != nil {
		return []domain.Exam{}
	}
	defer rows.Close()

	var out []domain.Exam
	for rows.Next() {
		var e domain.Exam
		if err := rows.Scan(&e.ID, &e.ClassName, &e.Year, &e.Month, &e.Day, &e.Hour, &e.Minute, &e.Period, &e.Enabled); err != nil {
			continue
		}
		out = append(out, e)
	}
	if out == nil {
		out = []domain.Exam{}
	}
	return out
}

func (r *ExamRepository) ReplaceAll(exams []domain.Exam) []domain.Exam {
	tx, err := r.db.Begin()
	if err != nil {
		return exams
	}
	defer tx.Rollback()

	tx.Exec(`DELETE FROM exams`)
	for _, e := range exams {
		tx.Exec(`INSERT INTO exams(id, class_name, year, month, day, hour, minute, period, enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
			e.ID, e.ClassName, e.Year, e.Month, e.Day, e.Hour, e.Minute, e.Period, e.Enabled)
	}
	tx.Commit()
	return r.List()
}

func (r *ExamRepository) GetMaster() bool {
	var enabled bool
	r.db.QueryRow(`SELECT enabled FROM exam_master WHERE id=1`).Scan(&enabled)
	return enabled
}

func (r *ExamRepository) SetMaster(enabled bool) {
	r.db.Exec(`UPDATE exam_master SET enabled=$1 WHERE id=1`, enabled)
}
