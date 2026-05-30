package setup

import (
	"testing"

	"voro/backend/internal/domain"
)

type mockGateway struct{}

func (m *mockGateway) Get() (domain.SetupState, error) { return domain.SetupState{}, nil }
func (m *mockGateway) MarkStep(step string) (domain.SetupState, error) {
	return domain.SetupState{}, nil
}

func TestMarkStep_InvalidStep(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	_, err := svc.MarkStep("invalid-step")
	if err == nil {
		t.Fatal("expected error for invalid step")
	}
}

func TestMarkStep_ValidSteps(t *testing.T) {
	svc := &Service{Gateway: &mockGateway{}}
	for _, step := range []string{"schedule", "alarm", "exam", "notes"} {
		if _, err := svc.MarkStep(step); err != nil {
			t.Errorf("step %q should be valid, got error: %v", step, err)
		}
	}
}
