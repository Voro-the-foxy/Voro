package attempt

import (
	"testing"

	"voro/backend/internal/domain"
)

type mockGateway struct{}

func (m *mockGateway) ListByClass(classID string) ([]domain.Attempt, error) {
	return []domain.Attempt{}, nil
}
func (m *mockGateway) GetByID(id string) (domain.Attempt, error) { return domain.Attempt{}, nil }
func (m *mockGateway) Add(a domain.Attempt) (domain.Attempt, error) { return a, nil }
func (m *mockGateway) DeleteByClass(classID string) error           { return nil }

func TestSave_GeneratesID(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	result, err := svc.Save(domain.Attempt{ClassID: "c1"})
	if err != nil {
		t.Fatal(err)
	}
	if result.ID == "" {
		t.Error("expected ID to be generated")
	}
}

func TestSave_SetsCompletedAt(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	result, err := svc.Save(domain.Attempt{ClassID: "c1"})
	if err != nil {
		t.Fatal(err)
	}
	if result.CompletedAt == 0 {
		t.Error("expected CompletedAt to be set")
	}
}

func TestSave_CalculatesTotal(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	result, err := svc.Save(domain.Attempt{
		ClassID:     "c1",
		QuestionIDs: []string{"q1", "q2", "q3"},
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Total != 3 {
		t.Errorf("expected Total=3, got %d", result.Total)
	}
}

func TestSave_PreservesExplicitTotal(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	result, err := svc.Save(domain.Attempt{
		ClassID:     "c1",
		QuestionIDs: []string{"q1", "q2"},
		Total:       10,
	})
	if err != nil {
		t.Fatal(err)
	}
	if result.Total != 10 {
		t.Errorf("expected Total=10 (explicit), got %d", result.Total)
	}
}
