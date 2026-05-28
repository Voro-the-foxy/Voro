package service

import "nomilk/backend/internal/domain"

type SetupGateway interface {
	Get() domain.SetupState
	MarkStep(step string) domain.SetupState
}
