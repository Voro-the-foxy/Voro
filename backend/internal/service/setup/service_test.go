package setup

import (
	"testing"

	"voro/backend/internal/domain"
)

type mockGateway struct {
	lastUserID string
}

func (m *mockGateway) Get(userID string) (domain.SetupState, error) {
	return domain.SetupState{}, nil
}
func (m *mockGateway) MarkStep(userID, step string) (domain.SetupState, error) {
	m.lastUserID = userID
	return domain.SetupState{}, nil
}

func TestMarkStep_InvalidStep(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	_, err := svc.MarkStep("user1", "invalid-step")
	if err == nil {
		t.Fatal("expected error for invalid step")
	}
}

func TestMarkStep_ValidSteps(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	for _, step := range []string{"schedule", "alarm", "exam", "notes"} {
		if _, err := svc.MarkStep("user1", step); err != nil {
			t.Errorf("step %q should be valid, got error: %v", step, err)
		}
	}
}

func TestMarkStep_PassesUserIDToGateway(t *testing.T) {
	gw := &mockGateway{}
	svc := &Service{Gateway: gw}
	if _, err := svc.MarkStep("user7", "alarm"); err != nil {
		t.Fatal(err)
	}
	if gw.lastUserID != "user7" {
		t.Errorf("expected gateway to receive userID=user7, got %q", gw.lastUserID)
	}
}
