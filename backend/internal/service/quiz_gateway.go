package service

import (
	"io"

	"nomilk/backend/internal/domain"
)

type QuizGateway interface {
	UploadDocument(body io.Reader, contentType string) (*domain.Document, error)
	ListDocuments() ([]domain.Document, error)
	DeleteDocument(id string) error
	CreateQuiz(documentID string, count int, difficulty string, threshold float64) (*domain.Quiz, error)
	GetQuiz(id string) (*domain.Quiz, error)
}
