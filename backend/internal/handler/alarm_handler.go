package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
	"nomilk/backend/internal/shared/errors"
)

type AlarmHandler struct {
	Service *service.AlarmService
}

func alarmToDTO(a domain.Alarm) dto.AlarmDTO {
	days := a.Days
	if days == nil {
		days = []string{}
	}
	return dto.AlarmDTO{ID: a.ID, Hour: a.Hour, Minute: a.Minute, Period: a.Period, Days: days, Enabled: a.Enabled}
}

func (h *AlarmHandler) List(w http.ResponseWriter, r *http.Request) {
	alarms := h.Service.List()
	out := make([]dto.AlarmDTO, len(alarms))
	for i, a := range alarms {
		out[i] = alarmToDTO(a)
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *AlarmHandler) ReplaceAll(w http.ResponseWriter, r *http.Request) {
	var req []dto.AlarmDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, errors.ErrInvalidRequest)
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
	result := h.Service.ReplaceAll(alarms)
	out := make([]dto.AlarmDTO, len(result))
	for i, a := range result {
		out[i] = alarmToDTO(a)
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *AlarmHandler) GetMaster(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, dto.AlarmsMasterDTO{Enabled: h.Service.GetMaster()})
}

func (h *AlarmHandler) SetMaster(w http.ResponseWriter, r *http.Request) {
	var req dto.AlarmsMasterDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	h.Service.SetMaster(req.Enabled)
	writeJSON(w, http.StatusOK, dto.AlarmsMasterDTO{Enabled: req.Enabled})
}
