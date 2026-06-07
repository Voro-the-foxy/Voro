package attempt

import (
	"encoding/json"
	"net/http"

	"voro/backend/internal/domain"
	attemptsvc "voro/backend/internal/service/attempt"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *attemptsvc.Service
}

func toDTO(a domain.Attempt) DTO {
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
	return DTO{
		ID: a.ID, ClassID: a.ClassID, QuizID: a.QuizID, LectureTitle: a.LectureTitle,
		QuestionIDs: questionIDs, Answers: answers, CorrectIndices: correctIndices,
		Score: a.Score, Total: a.Total, CompletedAt: a.CompletedAt,
	}
}

// List godoc
//
//	@Summary		List quiz attempts
//	@Tags			attempts
//	@Produce		json
//	@Security		BearerAuth
//	@Param			classId	query	string	false	"Class ID (omit for all)"
//	@Success		200		{array}	DTO
//	@Router			/api/attempts [get]
func (h *Handler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	classID := r.URL.Query().Get("classId")
	attempts, err := h.Service.List(userID, classID)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]DTO, len(attempts))
	for i, a := range attempts {
		out[i] = toDTO(a)
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

// GetByID godoc
//
//	@Summary		Get a quiz attempt
//	@Tags			attempts
//	@Produce		json
//	@Security		BearerAuth
//	@Param			id	path		string	true	"Attempt ID"
//	@Success		200	{object}	DTO
//	@Router			/api/attempts/{id} [get]
func (h *Handler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	id := r.PathValue("id")
	if id == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	a, err := h.Service.GetByID(userID, id)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toDTO(a))
}

// Save godoc
//
//	@Summary		Save a quiz attempt
//	@Tags			attempts
//	@Accept			json
//	@Produce		json
//	@Security		BearerAuth
//	@Param			body	body		CreateRequest	true	"Attempt payload"
//	@Success		201		{object}	DTO
//	@Router			/api/attempts [post]
func (h *Handler) Save(w http.ResponseWriter, r *http.Request) {
	userID, ok := httputil.UserID(w, r)
	if !ok {
		return
	}
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ClassID == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	a, err := h.Service.Save(userID, domain.Attempt{
		ClassID:        req.ClassID,
		QuizID:         req.QuizID,
		LectureTitle:   req.LectureTitle,
		QuestionIDs:    req.QuestionIDs,
		Answers:        req.Answers,
		CorrectIndices: req.CorrectIndices,
		Score:          req.Score,
		Total:          req.Total,
	})
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, toDTO(a))
}

// DeleteByClass godoc
//
//	@Summary		Delete all attempts by class
//	@Tags			attempts
//	@Security		BearerAuth
//	@Param			classId	query	string	true	"Class ID"
//	@Success		204
//	@Router			/api/attempts [delete]
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
