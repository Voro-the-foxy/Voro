package note

import (
	"voro/backend/internal/domain"
	"voro/backend/internal/shared/gen"
)

type Service struct {
	Gateway Gateway
}

func (s *Service) ListByClass(classID string) ([]domain.Note, error) {
	return s.Gateway.ListByClass(classID)
}

func (s *Service) Add(classID, filename string, size int64, documentID string) (domain.Note, error) {
	return s.Gateway.Add(domain.Note{
		ID:         gen.NewID(),
		ClassID:    classID,
		Filename:   filename,
		Size:       size,
		AddedAt:    gen.NowMillis(),
		DocumentID: documentID,
	})
}

func (s *Service) Delete(id string) error {
	return s.Gateway.Delete(id)
}

func (s *Service) DeleteByClass(classID string) error {
	return s.Gateway.DeleteByClass(classID)
}
