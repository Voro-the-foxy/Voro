package exam

import "voro/backend/internal/domain"

type Gateway interface {
	List(userID string) ([]domain.Exam, error)
	ReplaceAll(userID string, exams []domain.Exam) ([]domain.Exam, error)
	GetMaster(userID string) (bool, error)
	SetMaster(userID string, enabled bool) error
}
