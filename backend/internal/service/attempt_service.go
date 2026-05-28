package service

import "nomilk/backend/internal/domain"

type AttemptService struct {
	Gateway AttemptGateway
}

func (s *AttemptService) List(classID string) []domain.Attempt {
	if classID != "" {
		return s.Gateway.ListByClass(classID)
	}
	return s.Gateway.List()
}

func (s *AttemptService) GetByID(id string) (domain.Attempt, error) {
	return s.Gateway.GetByID(id)
}

func (s *AttemptService) Save(input domain.Attempt) domain.Attempt {
	if input.ID == "" {
		input.ID = newID()
	}
	if input.CompletedAt == 0 {
		input.CompletedAt = nowMillis()
	}
	if input.Total == 0 {
		input.Total = len(input.QuestionIDs)
	}
	return s.Gateway.Add(input)
}

func (s *AttemptService) DeleteByClass(classID string) {
	s.Gateway.DeleteByClass(classID)
}
