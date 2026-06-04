package note

import (
	"voro/backend/internal/domain"
	"voro/backend/internal/shared/gen"
)

type Service struct {
	Gateway Gateway
}

func (s *Service) ListByClass(userID, classID string) ([]domain.Note, error) {
	return s.Gateway.ListByClass(userID, classID)
}

func (s *Service) Add(userID, classID, filename string, size int64, documentID string) (domain.Note, error) {
	return s.Gateway.Add(userID, domain.Note{
		ID:         gen.NewID(),
		ClassID:    classID,
		Filename:   filename,
		Size:       size,
		AddedAt:    gen.NowMillis(),
		DocumentID: documentID,
	})
}

func (s *Service) Delete(userID, id string) error {
	return s.Gateway.Delete(userID, id)
}

func (s *Service) DeleteByClass(userID, classID string) error {
	return s.Gateway.DeleteByClass(userID, classID)
}
