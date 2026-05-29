package quiz

import (
	"encoding/json"
	"net/http"

	"voro/backend/internal/domain"
	quizsvc "voro/backend/internal/service/quiz"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/httputil"
)

type Handler struct {
	Service *quizsvc.Service
}

const maxUploadSize = 50 << 20 // 50 MiB

func (h *Handler) UploadDocument(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadSize)
	doc, err := h.Service.UploadDocument(r.Body, r.Header.Get("Content-Type"))
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, DocumentDTO{
		ID: doc.ID, Title: doc.Title, SourceType: doc.SourceType, ChunkCount: doc.ChunkCount,
	})
}

func (h *Handler) ListDocuments(w http.ResponseWriter, r *http.Request) {
	docs, err := h.Service.ListDocuments()
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	out := make([]DocumentDTO, 0, len(docs))
	for _, d := range docs {
		out = append(out, DocumentDTO{
			ID: d.ID, Title: d.Title, SourceType: d.SourceType, ChunkCount: d.ChunkCount,
		})
	}
	httputil.WriteJSON(w, http.StatusOK, out)
}

func (h *Handler) DeleteDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	if err := h.Service.DeleteDocument(id); err != nil {
		httputil.WriteError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) CreateQuiz(w http.ResponseWriter, r *http.Request) {
	var req CreateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	q, err := h.Service.CreateQuiz(req.DocumentID, req.Count, req.Difficulty, req.Threshold)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusCreated, toQuizDTO(q))
}

func (h *Handler) GetQuiz(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		httputil.WriteError(w, apperrors.ErrInvalidRequest)
		return
	}
	q, err := h.Service.GetQuiz(id)
	if err != nil {
		httputil.WriteError(w, err)
		return
	}
	httputil.WriteJSON(w, http.StatusOK, toQuizDTO(q))
}

func toQuizDTO(q *domain.Quiz) QuizDTO {
	out := QuizDTO{
		ID:         q.ID,
		DocumentID: q.DocumentID,
		Status:     q.Status,
		Questions:  make([]QuestionDTO, 0, len(q.Questions)),
	}
	for _, qq := range q.Questions {
		out.Questions = append(out.Questions, QuestionDTO{
			ID:              qq.ID,
			QuestionText:    qq.QuestionText,
			Choices:         qq.Choices,
			AnswerIndex:     qq.AnswerIndex,
			Explanation:     qq.Explanation,
			SourceChunkIDs:  qq.SourceChunkIDs,
			ValidationScore: qq.ValidationScore,
		})
	}
	return out
}
