package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
)

type PlaceHandler struct {
	Service *service.PlaceService
}

func (h *PlaceHandler) GetAllStores(w http.ResponseWriter, r *http.Request) {
	places, err := h.Service.GetAllPlaces()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var dtos []dto.PlaceDTO
	for _, p := range places {
		dtos = append(dtos, dto.PlaceDTO{
			ID:      p.ID,
			Name:    p.Name,
			Address: p.Address,
		})
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(dtos)
}
