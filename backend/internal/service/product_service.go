package service

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

type ProductService struct {
	Repo *repository.ProductRepository
}

func (s *ProductService) GetProductById(id int) (*domain.Product, error) {
	product, err := s.Repo.FindById(id)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func (s *ProductService) GetAllProdcuts() ([]domain.Product, error) {
	product, err := s.Repo.FindALL()
	if err != nil {
		return nil, err
	}
	return product, nil
}
