package alarm

import "voro/backend/internal/domain"

type Service struct {
	Gateway Gateway
}

func (s *Service) List(userID string) ([]domain.Alarm, error) {
	return s.Gateway.List(userID)
}

func (s *Service) ReplaceAll(userID string, alarms []domain.Alarm) ([]domain.Alarm, error) {
	return s.Gateway.ReplaceAll(userID, alarms)
}

func (s *Service) GetMaster(userID string) (bool, error) {
	return s.Gateway.GetMaster(userID)
}

func (s *Service) SetMaster(userID string, enabled bool) error {
	return s.Gateway.SetMaster(userID, enabled)
}
