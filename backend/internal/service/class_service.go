package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type ClassService struct {
	Repo *repository.ClassRepository
}

func (s *ClassService) List() []domain.ClassItem {
	return s.Repo.List()
}

func (s *ClassService) ReplaceAll(classes []domain.ClassItem) []domain.ClassItem {
	return s.Repo.ReplaceAll(classes)
}

func (s *ClassService) Add(name string) domain.ClassItem {
	id := newID()
	return s.Repo.Add(domain.ClassItem{ID: id, Name: name, Slots: []string{}})
}

func (s *ClassService) Delete(id string) error {
	return s.Repo.Delete(id)
}
