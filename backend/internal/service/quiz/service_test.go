package quiz

import (
	"io"
	"testing"

	"voro/backend/internal/domain"
)

type capturingGateway struct {
	count      int
	difficulty string
	threshold  float64
}

func (m *capturingGateway) UploadDocument(body io.Reader, contentType string) (*domain.Document, error) {
	return &domain.Document{}, nil
}
func (m *capturingGateway) ListDocuments() ([]domain.Document, error) { return nil, nil }
func (m *capturingGateway) DeleteDocument(id string) error            { return nil }
func (m *capturingGateway) CreateQuiz(documentID string, count int, difficulty string, threshold float64) (*domain.Quiz, error) {
	m.count = count
	m.difficulty = difficulty
	m.threshold = threshold
	return &domain.Quiz{}, nil
}
func (m *capturingGateway) GetQuiz(id string) (*domain.Quiz, error) { return &domain.Quiz{}, nil }

func TestCreateQuiz_EmptyDocumentID(t *testing.T) {
	svc := &Service{Gateway: &capturingGateway{}}
	_, err := svc.CreateQuiz("", 0, "", 0)
	if err == nil {
		t.Fatal("expected error for empty documentID")
	}
}

func TestCreateQuiz_DefaultCount(t *testing.T) {
	gw := &capturingGateway{}
	svc := &Service{Gateway: gw}
	if _, err := svc.CreateQuiz("doc-id", 0, "medium", 0.7); err != nil {
		t.Fatal(err)
	}
	if gw.count != 5 {
		t.Errorf("expected default count=5, got %d", gw.count)
	}
}

func TestCreateQuiz_DefaultDifficulty(t *testing.T) {
	gw := &capturingGateway{}
	svc := &Service{Gateway: gw}
	if _, err := svc.CreateQuiz("doc-id", 5, "", 0.7); err != nil {
		t.Fatal(err)
	}
	if gw.difficulty != "medium" {
		t.Errorf("expected default difficulty=medium, got %q", gw.difficulty)
	}
}

func TestCreateQuiz_DefaultThreshold(t *testing.T) {
	gw := &capturingGateway{}
	svc := &Service{Gateway: gw}
	if _, err := svc.CreateQuiz("doc-id", 5, "medium", 0); err != nil {
		t.Fatal(err)
	}
	if gw.threshold != 0.7 {
		t.Errorf("expected default threshold=0.7, got %f", gw.threshold)
	}
}
