package alarm

import "voro/backend/internal/domain"

type Gateway interface {
	List() ([]domain.Alarm, error)
	ReplaceAll(alarms []domain.Alarm) ([]domain.Alarm, error)
	GetMaster() (bool, error)
	SetMaster(enabled bool) error
}
