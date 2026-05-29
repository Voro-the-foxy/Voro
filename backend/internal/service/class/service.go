package class

import (
	"voro/backend/internal/domain"
	"voro/backend/internal/shared/gen"
)

type Service struct {
	Gateway Gateway
}

func (s *Service) List() ([]domain.ClassItem, error) {
	return s.Gateway.List()
}

func (s *Service) ReplaceAll(classes []domain.ClassItem) ([]domain.ClassItem, error) {
	return s.Gateway.ReplaceAll(classes)
}

func (s *Service) Add(name string) (domain.ClassItem, error) {
	return s.Gateway.Add(domain.ClassItem{ID: gen.NewID(), Name: name, Slots: []string{}})
}

func (s *Service) Delete(id string) error {
	return s.Gateway.Delete(id)
}
