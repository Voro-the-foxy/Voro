package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
	"nomilk/backend/internal/shared/errors"
)

type AttemptHandler struct {
	Service *service.AttemptService
}

func attemptToDTO(a domain.Attempt) dto.AttemptDTO {
	questionIDs := a.QuestionIDs
	if questionIDs == nil {
		questionIDs = []string{}
	}
	answers := a.Answers
	if answers == nil {
		answers = []int{}
	}
	correctIndices := a.CorrectIndices
	if correctIndices == nil {
		correctIndices = []int{}
	}
	return dto.AttemptDTO{
		ID: a.ID, ClassID: a.ClassID, QuizID: a.QuizID, LectureTitle: a.LectureTitle,
		QuestionIDs: questionIDs, Answers: answers, CorrectIndices: correctIndices,
		Score: a.Score, Total: a.Total, CompletedAt: a.CompletedAt,
	}
}

func (h *AttemptHandler) List(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	attempts := h.Service.List(classID)
	out := make([]dto.AttemptDTO, len(attempts))
	for i, a := range attempts {
		out[i] = attemptToDTO(a)
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *AttemptHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	a, err := h.Service.GetByID(id)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, attemptToDTO(a))
}

func (h *AttemptHandler) Save(w http.ResponseWriter, r *http.Request) {
	var req dto.AttemptCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ClassID == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	input := domain.Attempt{
		ClassID:        req.ClassID,
		QuizID:         req.QuizID,
		LectureTitle:   req.LectureTitle,
		QuestionIDs:    req.QuestionIDs,
		Answers:        req.Answers,
		CorrectIndices: req.CorrectIndices,
		Score:          req.Score,
		Total:          req.Total,
	}
	a := h.Service.Save(input)
	writeJSON(w, http.StatusCreated, attemptToDTO(a))
}

func (h *AttemptHandler) DeleteByClass(w http.ResponseWriter, r *http.Request) {
	classID := r.URL.Query().Get("classId")
	if classID == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	h.Service.DeleteByClass(classID)
	w.WriteHeader(http.StatusNoContent)
}
