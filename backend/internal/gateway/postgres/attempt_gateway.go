package postgres

import (
	"database/sql"

	"nomilk/backend/internal/domain"
	apperrors "nomilk/backend/internal/shared/errors"
)

type AttemptGateway struct {
	db *sql.DB
}

func NewAttemptGateway(db *sql.DB) *AttemptGateway {
	return &AttemptGateway{db: db}
}

func (g *AttemptGateway) List() []domain.Attempt {
	rows, err := g.db.Query(`SELECT id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at FROM attempts ORDER BY completed_at DESC`)
	if err != nil {
		return []domain.Attempt{}
	}
	defer rows.Close()
	return g.scanRows(rows)
}

func (g *AttemptGateway) ListByClass(classID string) []domain.Attempt {
	rows, err := g.db.Query(`SELECT id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at FROM attempts WHERE class_id=$1 ORDER BY completed_at DESC`, classID)
	if err != nil {
		return []domain.Attempt{}
	}
	defer rows.Close()
	return g.scanRows(rows)
}

func (g *AttemptGateway) GetByID(id string) (domain.Attempt, error) {
	var a domain.Attempt
	var qJSON, aJSON, cJSON []byte
	err := g.db.QueryRow(`SELECT id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at FROM attempts WHERE id=$1`, id).
		Scan(&a.ID, &a.ClassID, &a.QuizID, &a.LectureTitle, &qJSON, &aJSON, &cJSON, &a.Score, &a.Total, &a.CompletedAt)
	if err == sql.ErrNoRows {
		return domain.Attempt{}, apperrors.ErrNotFound
	}
	if err != nil {
		return domain.Attempt{}, apperrors.ErrInternalServer
	}
	jsonScan(qJSON, &a.QuestionIDs)
	jsonScan(aJSON, &a.Answers)
	jsonScan(cJSON, &a.CorrectIndices)
	ensureIntSlices(&a)
	return a, nil
}

func (g *AttemptGateway) Add(a domain.Attempt) domain.Attempt {
	ensureIntSlices(&a)
	g.db.Exec(`INSERT INTO attempts(id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		a.ID, a.ClassID, a.QuizID, a.LectureTitle,
		jsonMarshal(a.QuestionIDs), jsonMarshal(a.Answers), jsonMarshal(a.CorrectIndices),
		a.Score, a.Total, a.CompletedAt)
	return a
}

func (g *AttemptGateway) DeleteByClass(classID string) {
	g.db.Exec(`DELETE FROM attempts WHERE class_id=$1`, classID)
}

func (g *AttemptGateway) scanRows(rows *sql.Rows) []domain.Attempt {
	var out []domain.Attempt
	for rows.Next() {
		var a domain.Attempt
		var qJSON, aJSON, cJSON []byte
		if err := rows.Scan(&a.ID, &a.ClassID, &a.QuizID, &a.LectureTitle, &qJSON, &aJSON, &cJSON, &a.Score, &a.Total, &a.CompletedAt); err != nil {
			continue
		}
		jsonScan(qJSON, &a.QuestionIDs)
		jsonScan(aJSON, &a.Answers)
		jsonScan(cJSON, &a.CorrectIndices)
		ensureIntSlices(&a)
		out = append(out, a)
	}
	if out == nil {
		out = []domain.Attempt{}
	}
	return out
}

func ensureIntSlices(a *domain.Attempt) {
	if a.QuestionIDs == nil {
		a.QuestionIDs = []string{}
	}
	if a.Answers == nil {
		a.Answers = []int{}
	}
	if a.CorrectIndices == nil {
		a.CorrectIndices = []int{}
	}
}
