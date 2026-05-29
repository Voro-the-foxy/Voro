package setup

import "voro/backend/internal/domain"

type Gateway interface {
	Get() (domain.SetupState, error)
	MarkStep(step string) (domain.SetupState, error)
}
