package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
)

type ProductHandler struct {
	Service *service.ProductService
}

func (h *ProductHandler) GetAllProducts(w http.ResponseWriter, r *http.Request) {
	product, err := h.Service.GetAllProdcuts()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var dtos []dto.ProductDTO
	for _, p := range product {
		dtos = append(dtos, dto.ProductDTO{
			ID:    p.ID,
			Name:  p.Name,
			Price: p.Price,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dtos)
}
