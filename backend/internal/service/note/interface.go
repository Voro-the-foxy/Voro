package note

import "voro/backend/internal/domain"

type Gateway interface {
	ListByClass(classID string) ([]domain.Note, error)
	Add(n domain.Note) (domain.Note, error)
	Delete(id string) error
	DeleteByClass(classID string) error
}
