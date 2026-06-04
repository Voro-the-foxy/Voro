package attempt

import (
	"testing"

	"voro/backend/internal/domain"
)

type mockGateway struct {
	lastUserID string
}

func (m *mockGateway) ListByClass(userID, classID string) ([]domain.Attempt, error) {
	m.lastUserID = userID
	return []domain.Attempt{}, nil
}
func (m *mockGateway) GetByID(userID, id string) (domain.Attempt, error) {
	return domain.Attempt{}, nil
}
func (m *mockGateway) Add(userID string, a domain.Attempt) (domain.Attempt, error) {
	m.lastUserID = userID
	return a, nil
}
func (m *mockGateway) DeleteByClass(userID, classID string) error { return nil }

func TestSave_GeneratesID(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	result, err := svc.Save("user1", domain.Attempt{ClassID: "c1"})
	if err != nil {
		t.Fatal(err)
	}
	if result.ID == "" {
		t.Error("expected ID to be generated")
	}
}

func TestSave_SetsCompletedAt(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	result, err := svc.Save("user1", domain.Attempt{ClassID: "c1"})
	if err != nil {
		t.Fatal(err)
	}
	if result.CompletedAt == 0 {
		t.Error("expected CompletedAt to be set")
	}
}

func TestSave_CalculatesTotal(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	result, err := svc.Save("user1", domain.Attempt{
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
	result, err := svc.Save("user1", domain.Attempt{
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

func TestSave_PassesUserIDToGateway(t *testing.T) {
	gw := &mockGateway{}
	svc := &Service{Gateway: gw}
	if _, err := svc.Save("user42", domain.Attempt{ClassID: "c1"}); err != nil {
		t.Fatal(err)
	}
	if gw.lastUserID != "user42" {
		t.Errorf("expected gateway to receive userID=user42, got %q", gw.lastUserID)
	}
}
