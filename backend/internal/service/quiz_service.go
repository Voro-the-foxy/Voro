package service

import (
	"io"

	"nomilk/backend/internal/domain"
)

type QuizService struct {
	Gateway QuizGateway
}

func (s *QuizService) UploadDocument(body io.Reader, contentType string) (*domain.Document, error) {
	return s.Gateway.UploadDocument(body, contentType)
}

func (s *QuizService) ListDocuments() ([]domain.Document, error) {
	return s.Gateway.ListDocuments()
}

func (s *QuizService) DeleteDocument(id string) error {
	return s.Gateway.DeleteDocument(id)
}

func (s *QuizService) CreateQuiz(documentID string, count int, difficulty string, threshold float64) (*domain.Quiz, error) {
	return s.Gateway.CreateQuiz(documentID, count, difficulty, threshold)
}

func (s *QuizService) GetQuiz(id string) (*domain.Quiz, error) {
	return s.Gateway.GetQuiz(id)
}
