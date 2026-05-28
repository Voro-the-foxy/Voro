package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type SetupService struct {
	Repo *repository.SetupRepository
}

func (s *SetupService) Get() domain.SetupState {
	return s.Repo.Get()
}

func (s *SetupService) MarkStep(step string) domain.SetupState {
	return s.Repo.MarkStep(step)
}
