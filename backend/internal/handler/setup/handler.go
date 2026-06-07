package setup

import (
	"encoding/json"
	"net/http"

	setupsvc "voro/backend/internal/service/setup"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *setupsvc.Service
}

// Get godoc
//
//	@Summary		Get onboarding state
//	@Tags			setup
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	StateDTO
//	@Router			/api/setup [get]
func (h *Handler) Get(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	s, err := h.Service.Get(userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, StateDTO{Schedule: s.Schedule, Alarm: s.Alarm, Exam: s.Exam, Notes: s.Notes})
}

// MarkStep godoc
//
//	@Summary		Mark onboarding step complete
//	@Tags			setup
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		StepRequest	true	"Step to mark (schedule | alarm | exam | notes)"
//	@Success		200		{object}	StateDTO
//	@Router			/api/setup/steps [post]
func (h *Handler) MarkStep(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	var req StepRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Step == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	s, err := h.Service.MarkStep(userID, req.Step)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, StateDTO{Schedule: s.Schedule, Alarm: s.Alarm, Exam: s.Exam, Notes: s.Notes})
}
