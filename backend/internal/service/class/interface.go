package class

import "voro/backend/internal/domain"

type Gateway interface {
	List() ([]domain.ClassItem, error)
	ReplaceAll(classes []domain.ClassItem) ([]domain.ClassItem, error)
	Add(c domain.ClassItem) (domain.ClassItem, error)
	Delete(id string) error
}
