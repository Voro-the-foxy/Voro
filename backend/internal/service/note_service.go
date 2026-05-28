package service

import "nomilk/backend/internal/domain"

type NoteService struct {
	Gateway NoteGateway
}

func (s *NoteService) ListByClass(classID string) []domain.Note {
	return s.Gateway.ListByClass(classID)
}

func (s *NoteService) Add(classID, filename string, size int64, documentID string) domain.Note {
	return s.Gateway.Add(domain.Note{
		ID:         newID(),
		ClassID:    classID,
		Filename:   filename,
		Size:       size,
		AddedAt:    nowMillis(),
		DocumentID: documentID,
	})
}

func (s *NoteService) Delete(id string) error {
	return s.Gateway.Delete(id)
}

func (s *NoteService) DeleteByClass(classID string) {
	s.Gateway.DeleteByClass(classID)
}
