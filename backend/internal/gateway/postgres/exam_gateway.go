package postgres

import (
	"database/sql"

	"nomilk/backend/internal/domain"
)

type ExamGateway struct {
	db *sql.DB
}

func NewExamGateway(db *sql.DB) *ExamGateway {
	return &ExamGateway{db: db}
}

func (g *ExamGateway) List() []domain.Exam {
	rows, err := g.db.Query(`SELECT id, class_name, year, month, day, hour, minute, period, enabled FROM exams ORDER BY year, month, day`)
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

func (g *ExamGateway) ReplaceAll(exams []domain.Exam) []domain.Exam {
	tx, err := g.db.Begin()
	if err != nil {
		return exams
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM exams`); err != nil {
		return exams
	}
	for _, e := range exams {
		if _, err := tx.Exec(`INSERT INTO exams(id, class_name, year, month, day, hour, minute, period, enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
			e.ID, e.ClassName, e.Year, e.Month, e.Day, e.Hour, e.Minute, e.Period, e.Enabled); err != nil {
			return exams
		}
	}
	tx.Commit()
	return g.List()
}

func (g *ExamGateway) GetMaster() bool {
	var enabled bool
	g.db.QueryRow(`SELECT enabled FROM exam_master WHERE id=1`).Scan(&enabled)
	return enabled
}

func (g *ExamGateway) SetMaster(enabled bool) {
	g.db.Exec(`UPDATE exam_master SET enabled=$1 WHERE id=1`, enabled)
}
