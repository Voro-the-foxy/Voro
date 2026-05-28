package service

import "nomilk/backend/internal/domain"

type SetupService struct {
	Gateway SetupGateway
}

func (s *SetupService) Get() domain.SetupState {
	return s.Gateway.Get()
}

func (s *SetupService) MarkStep(step string) domain.SetupState {
	return s.Gateway.MarkStep(step)
}
