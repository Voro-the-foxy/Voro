package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
	"nomilk/backend/internal/shared/errors"
)

type ExamHandler struct {
	Service *service.ExamService
}

func examToDTO(e domain.Exam) dto.ExamDTO {
	return dto.ExamDTO{
		ID: e.ID, ClassName: e.ClassName, Year: e.Year, Month: e.Month,
		Day: e.Day, Hour: e.Hour, Minute: e.Minute, Period: e.Period, Enabled: e.Enabled,
	}
}

func (h *ExamHandler) List(w http.ResponseWriter, r *http.Request) {
	exams := h.Service.List()
	out := make([]dto.ExamDTO, len(exams))
	for i, e := range exams {
		out[i] = examToDTO(e)
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *ExamHandler) ReplaceAll(w http.ResponseWriter, r *http.Request) {
	var req []dto.ExamDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	exams := make([]domain.Exam, len(req))
	for i, e := range req {
		exams[i] = domain.Exam{
			ID: e.ID, ClassName: e.ClassName, Year: e.Year, Month: e.Month,
			Day: e.Day, Hour: e.Hour, Minute: e.Minute, Period: e.Period, Enabled: e.Enabled,
		}
	}
	result := h.Service.ReplaceAll(exams)
	out := make([]dto.ExamDTO, len(result))
	for i, e := range result {
		out[i] = examToDTO(e)
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *ExamHandler) GetMaster(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, dto.ExamsMasterDTO{Enabled: h.Service.GetMaster()})
}

func (h *ExamHandler) SetMaster(w http.ResponseWriter, r *http.Request) {
	var req dto.ExamsMasterDTO
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	h.Service.SetMaster(req.Enabled)
	writeJSON(w, http.StatusOK, dto.ExamsMasterDTO{Enabled: req.Enabled})
}
