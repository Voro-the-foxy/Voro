package exam

import "voro/backend/internal/domain"

type Gateway interface {
	List() ([]domain.Exam, error)
	ReplaceAll(exams []domain.Exam) ([]domain.Exam, error)
	GetMaster() (bool, error)
	SetMaster(enabled bool) error
}
