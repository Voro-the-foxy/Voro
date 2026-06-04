package attempt

import (
	"voro/backend/internal/domain"
	"voro/backend/internal/shared/gen"
)

type Service struct {
	Gateway Gateway
}

func (s *Service) List(userID, classID string) ([]domain.Attempt, error) {
	return s.Gateway.ListByClass(userID, classID)
}

func (s *Service) GetByID(userID, id string) (domain.Attempt, error) {
	return s.Gateway.GetByID(userID, id)
}

func (s *Service) Save(userID string, input domain.Attempt) (domain.Attempt, error) {
	if input.ID == "" {
		input.ID = gen.NewID()
	}
	if input.CompletedAt == 0 {
		input.CompletedAt = gen.NowMillis()
	}
	if input.Total == 0 {
		input.Total = len(input.QuestionIDs)
	}
	return s.Gateway.Add(userID, input)
}

func (s *Service) DeleteByClass(userID, classID string) error {
	return s.Gateway.DeleteByClass(userID, classID)
}
