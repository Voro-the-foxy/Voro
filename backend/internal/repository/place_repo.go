package repository

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/mockdata"
	"nomilk/backend/internal/shared/errors"
)

type PlaceRepository struct{}

func (r *PlaceRepository) FindAll() ([]domain.Place, error) {
	if mockdata.Places == nil {
		return nil, errors.ErrNotFound
	}
	return mockdata.Places, nil
}

func (r *PlaceRepository) FindByID(id int) (*domain.Place, error) {
	for _, place := range mockdata.Places {
		if place.ID == id {
			return &place, nil
		}
	}
	return nil, errors.ErrNotFound
}
