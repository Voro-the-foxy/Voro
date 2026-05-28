package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type AttemptService struct {
	Repo *repository.AttemptRepository
}

func (s *AttemptService) List(classID string) []domain.Attempt {
	if classID != "" {
		return s.Repo.ListByClass(classID)
	}
	return s.Repo.List()
}

func (s *AttemptService) GetByID(id string) (domain.Attempt, error) {
	return s.Repo.GetByID(id)
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
	if input.Score == 0 && len(input.Answers) > 0 {
		score := 0
		for i, ans := range input.Answers {
			if i < len(input.CorrectIndices) && ans == input.CorrectIndices[i] {
				score++
			}
		}
		input.Score = score
	}
	return s.Repo.Add(input)
}

func (s *AttemptService) DeleteByClass(classID string) {
	s.Repo.DeleteByClass(classID)
}
