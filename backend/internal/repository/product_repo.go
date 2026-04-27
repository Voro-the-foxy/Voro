package repository

import (
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/mockdata"
	"nomilk/backend/internal/shared/errors"
)

type ProductRepository struct{}

func (r *ProductRepository) FindALL() ([]domain.Product, error) {
	if mockdata.Products == nil {
		return nil, errors.ErrNotFound
	}
	products := []domain.Product{}
	return products, nil
}

func (r *ProductRepository) FindById(id int) (*domain.Product, error) {
	for _, product := range mockdata.Products {
		if product.ID == id {
			return &product, nil
		}
	}
	return nil, errors.ErrNotFound
}
