package note

import "voro/backend/internal/domain"

type Gateway interface {
	ListByClass(userID, classID string) ([]domain.Note, error)
	Add(userID string, n domain.Note) (domain.Note, error)
	Delete(userID, id string) error
	DeleteByClass(userID, classID string) error
}
