package class

import (
	"encoding/json"
	"net/http"

	"voro/backend/internal/domain"
	classsvc "voro/backend/internal/service/class"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *classsvc.Service
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	classes, err := h.Service.List(userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]ItemDTO, len(classes))
	for i, c := range classes {
		slots := c.Slots
		if slots == nil {
			slots = []string{}
		}
		out[i] = ItemDTO{ID: c.ID, Name: c.Name, Slots: slots}
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

func (h *Handler) ReplaceAll(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	var req []ItemDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
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
	result, err := h.Service.ReplaceAll(userID, classes)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]ItemDTO, len(result))
	for i, c := range result {
		slots := c.Slots
		if slots == nil {
			slots = []string{}
		}
		out[i] = ItemDTO{ID: c.ID, Name: c.Name, Slots: slots}
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

func (h *Handler) Add(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	var req struct {
		Name  string   `json:"name"`
		Slots []string `json:"slots"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	c, err := h.Service.Add(userID, req.Name)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	slots := c.Slots
	if slots == nil {
		slots = []string{}
	}
	httputil.WriteJSON(w, http.StatusCreated, ItemDTO{ID: c.ID, Name: c.Name, Slots: slots})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	id := r.PathValue("id")
	if id == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	if err := h.Service.Delete(userID, id); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
