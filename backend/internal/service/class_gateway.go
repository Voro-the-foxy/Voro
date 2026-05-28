package service

import "nomilk/backend/internal/domain"

type ClassGateway interface {
	List() []domain.ClassItem
	ReplaceAll(classes []domain.ClassItem) []domain.ClassItem
	Add(c domain.ClassItem) domain.ClassItem
	Delete(id string) error
}
