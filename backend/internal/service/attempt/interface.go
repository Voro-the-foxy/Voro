package attempt

import "voro/backend/internal/domain"

type Gateway interface {
	ListByClass(userID, classID string) ([]domain.Attempt, error)
	GetByID(userID, id string) (domain.Attempt, error)
	Add(userID string, a domain.Attempt) (domain.Attempt, error)
	DeleteByClass(userID, classID string) error
}
