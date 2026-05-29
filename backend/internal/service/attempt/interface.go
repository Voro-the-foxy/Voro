package attempt

import "voro/backend/internal/domain"

type Gateway interface {
	ListByClass(classID string) ([]domain.Attempt, error)
	GetByID(id string) (domain.Attempt, error)
	Add(a domain.Attempt) (domain.Attempt, error)
	DeleteByClass(classID string) error
}
