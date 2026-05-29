package alarm

import "voro/backend/internal/domain"

type Service struct {
	Gateway Gateway
}

func (s *Service) List() ([]domain.Alarm, error) {
	return s.Gateway.List()
}

func (s *Service) ReplaceAll(alarms []domain.Alarm) ([]domain.Alarm, error) {
	return s.Gateway.ReplaceAll(alarms)
}

func (s *Service) GetMaster() (bool, error) {
	return s.Gateway.GetMaster()
}

func (s *Service) SetMaster(enabled bool) error {
	return s.Gateway.SetMaster(enabled)
}
