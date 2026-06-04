package setup

import "voro/backend/internal/domain"

type Gateway interface {
	Get(userID string) (domain.SetupState, error)
	MarkStep(userID, step string) (domain.SetupState, error)
}
