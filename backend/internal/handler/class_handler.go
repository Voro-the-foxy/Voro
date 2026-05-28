package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
	"nomilk/backend/internal/shared/errors"
)

type ClassHandler struct {
	Service *service.ClassService
}

func (h *ClassHandler) List(w http.ResponseWriter, r *http.Request) {
	classes := h.Service.List()
	out := make([]dto.ClassItemDTO, len(classes))
	for i, c := range classes {
		slots := c.Slots
		if slots == nil {
			slots = []string{}
		}
		out[i] = dto.ClassItemDTO{ID: c.ID, Name: c.Name, Slots: slots}
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *ClassHandler) ReplaceAll(w http.ResponseWriter, r *http.Request) {
	var req []dto.ClassItemDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	classes := make([]domain.ClassItem, len(req))
	for i, c := range req {
		slots := c.Slots
		if slots == nil {
			slots = []string{}
		}
		classes[i] = domain.ClassItem{ID: c.ID, Name: c.Name, Slots: slots}
	}
	result := h.Service.ReplaceAll(classes)
	out := make([]dto.ClassItemDTO, len(result))
	for i, c := range result {
		slots := c.Slots
		if slots == nil {
			slots = []string{}
		}
		out[i] = dto.ClassItemDTO{ID: c.ID, Name: c.Name, Slots: slots}
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *ClassHandler) Add(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name  string   `json:"name"`
		Slots []string `json:"slots"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	c := h.Service.Add(req.Name)
	slots := c.Slots
	if slots == nil {
		slots = []string{}
	}
	writeJSON(w, http.StatusCreated, dto.ClassItemDTO{ID: c.ID, Name: c.Name, Slots: slots})
}

func (h *ClassHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	if err := h.Service.Delete(id); err != nil {
		writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
