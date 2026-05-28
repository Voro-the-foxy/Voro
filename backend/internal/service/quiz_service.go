package service

import (
	"io"
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type QuizService struct {
	Repo *repository.AIRepository
}

func (s *QuizService) UploadDocument(body io.Reader, contentType string) (*domain.Document, error) {
	return s.Repo.UploadDocument(body, contentType)
}

func (s *QuizService) ListDocuments() ([]domain.Document, error) {
	return s.Repo.ListDocuments()
}

func (s *QuizService) DeleteDocument(id string) error {
	return s.Repo.DeleteDocument(id)
}

func (s *QuizService) CreateQuiz(documentID string, count int, difficulty string, threshold float64) (*domain.Quiz, error) {
	return s.Repo.CreateQuiz(documentID, count, difficulty, threshold)
}

func (s *QuizService) GetQuiz(id string) (*domain.Quiz, error) {
	return s.Repo.GetQuiz(id)
}
