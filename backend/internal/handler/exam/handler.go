package exam

import (
	"encoding/json"
	"net/http"

	"voro/backend/internal/domain"
	examsvc "voro/backend/internal/service/exam"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *examsvc.Service
}

func toDTO(e domain.Exam) DTO {
	return DTO{
		ID: e.ID, ClassName: e.ClassName, Year: e.Year, Month: e.Month,
		Day: e.Day, Hour: e.Hour, Minute: e.Minute, Period: e.Period, Enabled: e.Enabled,
	}
}

// List godoc
//
//	@Summary		List exams
//	@Tags			exams
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{array}		DTO
//	@Router			/api/exams [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	exams, err := h.Service.List(userID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]DTO, len(exams))
	for i, e := range exams {
		out[i] = toDTO(e)
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

// ReplaceAll godoc
//
//	@Summary		Replace all exams
//	@Tags			exams
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body	[]DTO	true	"Exam list"
//	@Success		200		{array}	DTO
//	@Router			/api/exams [put]
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
	exams := make([]domain.Exam, len(req))
	for i, e := range req {
		exams[i] = domain.Exam{
			ID: e.ID, ClassName: e.ClassName, Year: e.Year, Month: e.Month,
			Day: e.Day, Hour: e.Hour, Minute: e.Minute, Period: e.Period, Enabled: e.Enabled,
		}
	}
	result, err := h.Service.ReplaceAll(userID, exams)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]DTO, len(result))
	for i, e := range result {
		out[i] = toDTO(e)
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

// GetMaster godoc
//
//	@Summary		Get master exam status
//	@Tags			exams
//	@Produce		json
//	@Security		BearerAuth
//	@Success		200	{object}	MasterDTO
//	@Router			/api/exams/master [get]
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

// SetMaster godoc
//
//	@Summary		Set master exam status
//	@Tags			exams
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		MasterDTO	true	"Master exam status"
//	@Success		200		{object}	MasterDTO
//	@Router			/api/exams/master [put]
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
