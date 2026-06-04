package setup

import (
	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

var validSteps = map[string]bool{
	"schedule": true,
	"alarm":    true,
	"exam":     true,
	"notes":    true,
}

type Service struct {
	Gateway Gateway
}

func (s *Service) Get(userID string) (domain.SetupState, error) {
	return s.Gateway.Get(userID)
}

func (s *Service) MarkStep(userID, step string) (domain.SetupState, error) {
	if !validSteps[step] {
		return domain.SetupState{}, apperrors.ErrInvalidRequest
	}
	return s.Gateway.MarkStep(userID, step)
}
