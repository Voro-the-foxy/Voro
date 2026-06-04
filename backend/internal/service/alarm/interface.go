package alarm

import "voro/backend/internal/domain"

type Gateway interface {
	List(userID string) ([]domain.Alarm, error)
	ReplaceAll(userID string, alarms []domain.Alarm) ([]domain.Alarm, error)
	GetMaster(userID string) (bool, error)
	SetMaster(userID string, enabled bool) error
}
