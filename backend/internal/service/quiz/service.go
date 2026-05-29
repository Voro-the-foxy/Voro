package quiz

import (
	"io"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

type Service struct {
	Gateway Gateway
}

func (s *Service) UploadDocument(body io.Reader, contentType string) (*domain.Document, error) {
	return s.Gateway.UploadDocument(body, contentType)
}

func (s *Service) ListDocuments() ([]domain.Document, error) {
	return s.Gateway.ListDocuments()
}

func (s *Service) DeleteDocument(id string) error {
	return s.Gateway.DeleteDocument(id)
}

func (s *Service) CreateQuiz(documentID string, count int, difficulty string, threshold float64) (*domain.Quiz, error) {
	if documentID == "" {
		return nil, apperrors.ErrInvalidRequest
	}
	if count <= 0 {
		count = 5
	}
	if difficulty == "" {
		difficulty = "medium"
	}
	if threshold <= 0 {
		threshold = 0.7
	}
	return s.Gateway.CreateQuiz(documentID, count, difficulty, threshold)
}

func (s *Service) GetQuiz(id string) (*domain.Quiz, error) {
	return s.Gateway.GetQuiz(id)
}
