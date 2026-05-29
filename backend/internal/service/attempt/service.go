package attempt

import (
	"voro/backend/internal/domain"
	"voro/backend/internal/shared/gen"
)

type Service struct {
	Gateway Gateway
}

func (s *Service) List(classID string) ([]domain.Attempt, error) {
	return s.Gateway.ListByClass(classID)
}

func (s *Service) GetByID(id string) (domain.Attempt, error) {
	return s.Gateway.GetByID(id)
}

func (s *Service) Save(input domain.Attempt) (domain.Attempt, error) {
	if input.ID == "" {
		input.ID = gen.NewID()
	}
	if input.CompletedAt == 0 {
		input.CompletedAt = gen.NowMillis()
	}
	if input.Total == 0 {
		input.Total = len(input.QuestionIDs)
	}
	return s.Gateway.Add(input)
}

func (s *Service) DeleteByClass(classID string) error {
	return s.Gateway.DeleteByClass(classID)
}
