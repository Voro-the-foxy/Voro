package class

import "voro/backend/internal/domain"

type Gateway interface {
	List(userID string) ([]domain.ClassItem, error)
	ReplaceAll(userID string, classes []domain.ClassItem) ([]domain.ClassItem, error)
	Add(userID string, c domain.ClassItem) (domain.ClassItem, error)
	Delete(userID, id string) error
}
