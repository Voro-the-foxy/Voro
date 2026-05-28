package repository

import (
	"database/sql"

	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/shared/errors"
)

type AttemptRepository struct {
	db *sql.DB
}

func NewAttemptRepository(db *sql.DB) *AttemptRepository {
	return &AttemptRepository{db: db}
}

func (r *AttemptRepository) List() []domain.Attempt {
	rows, err := r.db.Query(`SELECT id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at FROM attempts ORDER BY completed_at DESC`)
	if err != nil {
		return []domain.Attempt{}
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *AttemptRepository) ListByClass(classID string) []domain.Attempt {
	rows, err := r.db.Query(`SELECT id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at FROM attempts WHERE class_id=$1 ORDER BY completed_at DESC`, classID)
	if err != nil {
		return []domain.Attempt{}
	}
	defer rows.Close()
	return r.scanRows(rows)
}

func (r *AttemptRepository) GetByID(id string) (domain.Attempt, error) {
	var a domain.Attempt
	var qJSON, aJSON, cJSON []byte
	err := r.db.QueryRow(`SELECT id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at FROM attempts WHERE id=$1`, id).
		Scan(&a.ID, &a.ClassID, &a.QuizID, &a.LectureTitle, &qJSON, &aJSON, &cJSON, &a.Score, &a.Total, &a.CompletedAt)
	if err == sql.ErrNoRows {
		return domain.Attempt{}, errors.ErrNotFound
	}
	if err != nil {
		return domain.Attempt{}, err
	}
	jsonScan(qJSON, &a.QuestionIDs)
	jsonScan(aJSON, &a.Answers)
	jsonScan(cJSON, &a.CorrectIndices)
	ensureIntSlices(&a)
	return a, nil
}

func (r *AttemptRepository) Add(a domain.Attempt) domain.Attempt {
	ensureIntSlices(&a)
	r.db.Exec(`INSERT INTO attempts(id, class_id, quiz_id, lecture_title, question_ids, answers, correct_indices, score, total, completed_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
		a.ID, a.ClassID, a.QuizID, a.LectureTitle,
		jsonMarshal(a.QuestionIDs), jsonMarshal(a.Answers), jsonMarshal(a.CorrectIndices),
		a.Score, a.Total, a.CompletedAt)
	return a
}

func (r *AttemptRepository) DeleteByClass(classID string) {
	r.db.Exec(`DELETE FROM attempts WHERE class_id=$1`, classID)
}

func (r *AttemptRepository) scanRows(rows *sql.Rows) []domain.Attempt {
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
