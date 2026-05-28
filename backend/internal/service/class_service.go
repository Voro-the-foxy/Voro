package service

import "nomilk/backend/internal/domain"

type ClassService struct {
	Gateway ClassGateway
}

func (s *ClassService) List() []domain.ClassItem {
	return s.Gateway.List()
}

func (s *ClassService) ReplaceAll(classes []domain.ClassItem) []domain.ClassItem {
	return s.Gateway.ReplaceAll(classes)
}

func (s *ClassService) Add(name string) domain.ClassItem {
	return s.Gateway.Add(domain.ClassItem{ID: newID(), Name: name, Slots: []string{}})
}

func (s *ClassService) Delete(id string) error {
	return s.Gateway.Delete(id)
}
