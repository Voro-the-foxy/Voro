package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
	"nomilk/backend/internal/shared/errors"
)

type NoteHandler struct {
	Service *service.NoteService
}

func (h *NoteHandler) ListByClass(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	notes := h.Service.ListByClass(classID)
	out := make([]dto.NoteDTO, len(notes))
	for i, n := range notes {
		out[i] = dto.NoteDTO{
			ID: n.ID, ClassID: n.ClassID, Filename: n.Filename,
			Size: n.Size, AddedAt: n.AddedAt, DocumentID: n.DocumentID,
		}
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *NoteHandler) Add(w http.ResponseWriter, r *http.Request) {
	var req dto.NoteCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ClassID == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	n := h.Service.Add(req.ClassID, req.Filename, req.Size, req.DocumentID)
	writeJSON(w, http.StatusCreated, dto.NoteDTO{
		ID: n.ID, ClassID: n.ClassID, Filename: n.Filename,
		Size: n.Size, AddedAt: n.AddedAt, DocumentID: n.DocumentID,
	})
}

func (h *NoteHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

func (h *NoteHandler) DeleteByClass(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	if classID == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	h.Service.DeleteByClass(classID)
	w.WriteHeader(http.StatusNoContent)
}
