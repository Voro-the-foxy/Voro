package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type PlaceService struct {
	Repo *repository.PlaceRepository
}

func (s *PlaceService) GetPlace(id int) (*domain.Place, error) {
	place, err := s.Repo.FindByID(id)
	if err != nil {
		return nil, err
	}
	return place, nil
}

func (s *PlaceService) GetAllPlaces() ([]domain.Place, error) {
	places, err := s.Repo.FindAll()
	if err != nil {
		return nil, err
	}
	return places, nil
}
