package service

import "nomilk/backend/internal/domain"

type AlarmService struct {
	Gateway AlarmGateway
}

func (s *AlarmService) List() []domain.Alarm {
	return s.Gateway.List()
}

func (s *AlarmService) ReplaceAll(alarms []domain.Alarm) []domain.Alarm {
	return s.Gateway.ReplaceAll(alarms)
}

func (s *AlarmService) GetMaster() bool {
	return s.Gateway.GetMaster()
}

func (s *AlarmService) SetMaster(enabled bool) {
	s.Gateway.SetMaster(enabled)
}
