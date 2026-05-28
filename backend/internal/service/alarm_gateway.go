package service

import "nomilk/backend/internal/domain"

type AlarmGateway interface {
	List() []domain.Alarm
	ReplaceAll(alarms []domain.Alarm) []domain.Alarm
	GetMaster() bool
	SetMaster(enabled bool)
}
