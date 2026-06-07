package note

import (
	"encoding/json"
	"net/http"

	notesvc "voro/backend/internal/service/note"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *notesvc.Service
}

// ListByClass godoc
//
//	@Summary		List notes by class
//	@Tags			notes
//	@Produce		json
//	@Security		BearerAuth
//	@Param			classId	query	string	true	"Class ID"
//	@Success		200		{array}	DTO
//	@Router			/api/notes [get]
func (h *Handler) ListByClass(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	classID := r.URL.Query().Get("classId")
	notes, err := h.Service.ListByClass(userID, classID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]DTO, len(notes))
	for i, n := range notes {
		out[i] = DTO{
			ID: n.ID, ClassID: n.ClassID, Filename: n.Filename,
			Size: n.Size, AddedAt: n.AddedAt, DocumentID: n.DocumentID,
		}
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

// Add godoc
//
//	@Summary		Add a note
//	@Tags			notes
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		CreateRequest	true	"Note payload"
//	@Success		201		{object}	DTO
//	@Router			/api/notes [post]
func (h *Handler) Add(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ClassID == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	n, err := h.Service.Add(userID, req.ClassID, req.Filename, req.Size, req.DocumentID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, DTO{
		ID: n.ID, ClassID: n.ClassID, Filename: n.Filename,
		Size: n.Size, AddedAt: n.AddedAt, DocumentID: n.DocumentID,
	})
}

// Delete godoc
//
//	@Summary		Delete a note
//	@Tags			notes
//	@Security		BearerAuth
//	@Param			id	path	string	true	"Note ID"
//	@Success		204
//	@Router			/api/notes/{id} [delete]
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

// DeleteByClass godoc
//
//	@Summary		Delete all notes by class
//	@Tags			notes
//	@Security		BearerAuth
//	@Param			classId	query	string	true	"Class ID"
//	@Success		204
//	@Router			/api/notes [delete]
func (h *Handler) DeleteByClass(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	classID := r.URL.Query().Get("classId")
	if classID == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	if err := h.Service.DeleteByClass(userID, classID); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
