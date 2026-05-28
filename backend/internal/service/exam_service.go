package service

import "nomilk/backend/internal/domain"

type ExamService struct {
	Gateway ExamGateway
}

func (s *ExamService) List() []domain.Exam {
	return s.Gateway.List()
}

func (s *ExamService) ReplaceAll(exams []domain.Exam) []domain.Exam {
	return s.Gateway.ReplaceAll(exams)
}

func (s *ExamService) GetMaster() bool {
	return s.Gateway.GetMaster()
}

func (s *ExamService) SetMaster(enabled bool) {
	s.Gateway.SetMaster(enabled)
}
