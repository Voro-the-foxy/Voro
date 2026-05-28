package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type NoteService struct {
	Repo *repository.NoteRepository
}

func (s *NoteService) ListByClass(classID string) []domain.Note {
	return s.Repo.ListByClass(classID)
}

func (s *NoteService) Add(classID, filename string, size int64, documentID string) domain.Note {
	n := domain.Note{
		ID:         newID(),
		ClassID:    classID,
		Filename:   filename,
		Size:       size,
		AddedAt:    nowMillis(),
		DocumentID: documentID,
	}
	return s.Repo.Add(n)
}

func (s *NoteService) Delete(id string) error {
	return s.Repo.Delete(id)
}

func (s *NoteService) DeleteByClass(classID string) {
	s.Repo.DeleteByClass(classID)
}
