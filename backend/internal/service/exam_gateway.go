package service

import "nomilk/backend/internal/domain"

type ExamGateway interface {
	List() []domain.Exam
	ReplaceAll(exams []domain.Exam) []domain.Exam
	GetMaster() bool
	SetMaster(enabled bool)
}
