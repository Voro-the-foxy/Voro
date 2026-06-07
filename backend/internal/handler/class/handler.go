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

// List godoc
//
//	@Summary		List classes
//	@Tags			classes
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{array}		ItemDTO
//	@Router			/api/classes [get]
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

// ReplaceAll godoc
//
//	@Summary		Replace all classes
//	@Tags			classes
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		[]ItemDTO	true	"Class list"
//	@Success		200		{array}		ItemDTO
//	@Router			/api/classes [put]
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

// Add godoc
//
//	@Summary		Add a class
//	@Tags			classes
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		object{name=string}	true	"Class name"
//	@Success		201		{object}	ItemDTO
//	@Router			/api/classes [post]
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

// Delete godoc
//
//	@Summary		Delete a class
//	@Tags			classes
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Class ID"
//	@Success		204
//	@Router			/api/classes/{id} [delete]
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
