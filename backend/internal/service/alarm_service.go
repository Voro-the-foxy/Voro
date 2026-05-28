package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type AlarmService struct {
	Repo *repository.AlarmRepository
}

func (s *AlarmService) List() []domain.Alarm {
	return s.Repo.List()
}

func (s *AlarmService) ReplaceAll(alarms []domain.Alarm) []domain.Alarm {
	return s.Repo.ReplaceAll(alarms)
}

func (s *AlarmService) GetMaster() bool {
	return s.Repo.GetMaster()
}

func (s *AlarmService) SetMaster(enabled bool) {
	s.Repo.SetMaster(enabled)
}
