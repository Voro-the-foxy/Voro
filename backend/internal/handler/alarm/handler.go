package alarm

import (
	"encoding/json"
	"net/http"

	"voro/backend/internal/domain"
	alarmsvc "voro/backend/internal/service/alarm"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *alarmsvc.Service
}

func toDTO(a domain.Alarm) DTO {
	days := a.Days
	if days == nil {
		days = []string{}
	}
	return DTO{ID: a.ID, Hour: a.Hour, Minute: a.Minute, Period: a.Period, Days: days, Enabled: a.Enabled}
}

func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	alarms, err := h.Service.List(userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]DTO, len(alarms))
	for i, a := range alarms {
		out[i] = toDTO(a)
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

func (h *Handler) ReplaceAll(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	var req []DTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	alarms := make([]domain.Alarm, len(req))
	for i, a := range req {
		days := a.Days
		if days == nil {
			days = []string{}
		}
		alarms[i] = domain.Alarm{ID: a.ID, Hour: a.Hour, Minute: a.Minute, Period: a.Period, Days: days, Enabled: a.Enabled}
	}
	result, err := h.Service.ReplaceAll(userID, alarms)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]DTO, len(result))
	for i, a := range result {
		out[i] = toDTO(a)
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

func (h *Handler) GetMaster(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	enabled, err := h.Service.GetMaster(userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, MasterDTO{Enabled: enabled})
}

func (h *Handler) SetMaster(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	var req MasterDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	if err := h.Service.SetMaster(userID, req.Enabled); err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, MasterDTO{Enabled: req.Enabled})
}
