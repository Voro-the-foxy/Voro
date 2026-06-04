package class

import (
	"voro/backend/internal/domain"
	"voro/backend/internal/shared/gen"
)

type Service struct {
	Gateway Gateway
}

func (s *Service) List(userID string) ([]domain.ClassItem, error) {
	return s.Gateway.List(userID)
}

func (s *Service) ReplaceAll(userID string, classes []domain.ClassItem) ([]domain.ClassItem, error) {
	return s.Gateway.ReplaceAll(userID, classes)
}

func (s *Service) Add(userID, name string) (domain.ClassItem, error) {
	return s.Gateway.Add(userID, domain.ClassItem{ID: gen.NewID(), Name: name, Slots: []string{}})
}

func (s *Service) Delete(userID, id string) error {
	return s.Gateway.Delete(userID, id)
}
