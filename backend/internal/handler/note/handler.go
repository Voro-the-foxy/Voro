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

func (h *Handler) ListByClass(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	notes, err := h.Service.ListByClass(classID)
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

func (h *Handler) Add(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ClassID == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	n, err := h.Service.Add(req.ClassID, req.Filename, req.Size, req.DocumentID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, DTO{
		ID: n.ID, ClassID: n.ClassID, Filename: n.Filename,
		Size: n.Size, AddedAt: n.AddedAt, DocumentID: n.DocumentID,
	})
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	if err := h.Service.Delete(id); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) DeleteByClass(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	if classID == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	if err := h.Service.DeleteByClass(classID); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
