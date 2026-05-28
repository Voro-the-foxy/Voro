package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
	"nomilk/backend/internal/shared/errors"
)

type SetupHandler struct {
	Service *service.SetupService
}

func (h *SetupHandler) Get(w http.ResponseWriter, r *http.Request) {
	s := h.Service.Get()
	writeJSON(w, http.StatusOK, dto.SetupStateDTO{Schedule: s.Schedule, Alarm: s.Alarm, Exam: s.Exam, Notes: s.Notes})
}

func (h *SetupHandler) MarkStep(w http.ResponseWriter, r *http.Request) {
	var req dto.SetupStepRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Step == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	s := h.Service.MarkStep(req.Step)
	writeJSON(w, http.StatusOK, dto.SetupStateDTO{Schedule: s.Schedule, Alarm: s.Alarm, Exam: s.Exam, Notes: s.Notes})
}
