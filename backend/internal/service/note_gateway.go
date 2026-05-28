package service

import "nomilk/backend/internal/domain"

type NoteGateway interface {
	ListByClass(classID string) []domain.Note
	Add(n domain.Note) domain.Note
	Delete(id string) error
	DeleteByClass(classID string)
}
