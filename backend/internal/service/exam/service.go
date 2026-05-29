package exam

import "voro/backend/internal/domain"

type Service struct {
	Gateway Gateway
}

func (s *Service) List() ([]domain.Exam, error) {
	return s.Gateway.List()
}

func (s *Service) ReplaceAll(exams []domain.Exam) ([]domain.Exam, error) {
	return s.Gateway.ReplaceAll(exams)
}

func (s *Service) GetMaster() (bool, error) {
	return s.Gateway.GetMaster()
}

func (s *Service) SetMaster(enabled bool) error {
	return s.Gateway.SetMaster(enabled)
}
