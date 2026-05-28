package service

import "nomilk/backend/internal/domain"

type AttemptGateway interface {
	List() []domain.Attempt
	ListByClass(classID string) []domain.Attempt
	GetByID(id string) (domain.Attempt, error)
	Add(a domain.Attempt) domain.Attempt
	DeleteByClass(classID string)
}
