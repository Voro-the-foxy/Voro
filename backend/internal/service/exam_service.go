package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type ExamService struct {
	Repo *repository.ExamRepository
}

func (s *ExamService) List() []domain.Exam {
	return s.Repo.List()
}

func (s *ExamService) ReplaceAll(exams []domain.Exam) []domain.Exam {
	return s.Repo.ReplaceAll(exams)
}

func (s *ExamService) GetMaster() bool {
	return s.Repo.GetMaster()
}

func (s *ExamService) SetMaster(enabled bool) {
	s.Repo.SetMaster(enabled)
}
