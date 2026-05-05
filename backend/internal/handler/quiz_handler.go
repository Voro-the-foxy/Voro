package handler

import (
	"encoding/json"
	"net/http"
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/handler/dto"
	"nomilk/backend/internal/service"
	"nomilk/backend/internal/shared/errors"
)

type QuizHandler struct {
	Service *service.QuizService
}

const maxUploadSize = 50 << 20 // 50 MiB

func writeError(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*errors.AppError); ok {
		http.Error(w, appErr.Message, appErr.Code)
		return
	}
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func (h *QuizHandler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	doc, err := h.Service.UploadDocument(r.Body, r.Header.Get("Content-Type"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, dto.DocumentDTO{
		ID: doc.ID, Title: doc.Title, SourceType: doc.SourceType, ChunkCount: doc.ChunkCount,
	})
}

func (h *QuizHandler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	docs, err := h.Service.ListDocuments()
	if err != nil {
		writeError(w, err)
		return
	}
	out := make([]dto.DocumentDTO, 0, len(docs))
	for _, d := range docs {
		out = append(out, dto.DocumentDTO{
			ID: d.ID, Title: d.Title, SourceType: d.SourceType, ChunkCount: d.ChunkCount,
		})
	}
	writeJSON(w, http.StatusOK, out)
}

func (h *QuizHandler) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	var req dto.QuizCreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	if req.DocumentID == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	if req.Count == 0 {
		req.Count = 5
	}
	if req.Difficulty == "" {
		req.Difficulty = "medium"
	}
	if req.Threshold == 0 {
		req.Threshold = 0.7
	}
	quiz, err := h.Service.CreateQuiz(req.DocumentID, req.Count, req.Difficulty, req.Threshold)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, toQuizDTO(quiz))
}

func (h *QuizHandler) GetQuiz(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		writeError(w, errors.ErrInvalidRequest)
		return
	}
	quiz, err := h.Service.GetQuiz(id)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, toQuizDTO(quiz))
}

func toQuizDTO(quiz *domain.Quiz) dto.QuizDTO {
	out := dto.QuizDTO{
		ID:         quiz.ID,
		DocumentID: quiz.DocumentID,
		Status:     quiz.Status,
		Questions:  make([]dto.QuestionDTO, 0, len(quiz.Questions)),
	}
	for _, q := range quiz.Questions {
		out.Questions = append(out.Questions, dto.QuestionDTO{
			ID:              q.ID,
			QuestionText:    q.QuestionText,
			Choices:         q.Choices,
			AnswerIndex:     q.AnswerIndex,
			Explanation:     q.Explanation,
			SourceChunkIDs:  q.SourceChunkIDs,
			ValidationScore: q.ValidationScore,
		})
	}
	return out
}
