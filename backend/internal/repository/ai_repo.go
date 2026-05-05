package repository

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/shared/errors"
	"os"
	"time"
)

type AIRepository struct {
	BaseURL string
	Client  *http.Client
}

func NewAIRepository() *AIRepository {
	base := os.Getenv("AI_SERVER_URL")
	if base == "" {
		base = "http://localhost:8000"
	}
	return &AIRepository{
		BaseURL: base,
		Client:  &http.Client{Timeout: 5 * time.Minute},
	}
}

type aiDocument struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	SourceType string `json:"source_type"`
	ChunkCount int    `json:"chunk_count"`
}

type aiQuestion struct {
	ID              string   `json:"id"`
	QuestionText    string   `json:"question_text"`
	Choices         []string `json:"choices"`
	AnswerIndex     int      `json:"answer_index"`
	Explanation     *string  `json:"explanation"`
	SourceChunkIDs  []string `json:"source_chunk_ids"`
	ValidationScore *float64 `json:"validation_score"`
}

type aiQuiz struct {
	ID         string       `json:"id"`
	DocumentID string       `json:"document_id"`
	Status     string       `json:"status"`
	Questions  []aiQuestion `json:"questions"`
}

type aiQuizCreate struct {
	DocumentID string  `json:"document_id"`
	Count      int     `json:"count"`
	Difficulty string  `json:"difficulty"`
	Threshold  float64 `json:"threshold"`
}

func (r *AIRepository) UploadDocument(body io.Reader, contentType string) (*domain.Document, error) {
	req, err := http.NewRequest(http.MethodPost, r.BaseURL+"/api/documents", body)
	if err != nil {
		return nil, errors.ErrInternalServer
	}
	req.Header.Set("Content-Type", contentType)

	resp, err := r.Client.Do(req)
	if err != nil {
		return nil, errors.ErrInternalServer
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, mapStatus(resp)
	}
	var d aiDocument
	if err := json.NewDecoder(resp.Body).Decode(&d); err != nil {
		return nil, errors.ErrInternalServer
	}
	return &domain.Document{
		ID: d.ID, Title: d.Title, SourceType: d.SourceType, ChunkCount: d.ChunkCount,
	}, nil
}

func (r *AIRepository) ListDocuments() ([]domain.Document, error) {
	resp, err := r.Client.Get(r.BaseURL + "/api/documents")
	if err != nil {
		return nil, errors.ErrInternalServer
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, mapStatus(resp)
	}
	var raw []aiDocument
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		return nil, errors.ErrInternalServer
	}
	out := make([]domain.Document, 0, len(raw))
	for _, d := range raw {
		out = append(out, domain.Document{
			ID: d.ID, Title: d.Title, SourceType: d.SourceType, ChunkCount: d.ChunkCount,
		})
	}
	return out, nil
}

func (r *AIRepository) CreateQuiz(documentID string, count int, difficulty string, threshold float64) (*domain.Quiz, error) {
	body, _ := json.Marshal(aiQuizCreate{
		DocumentID: documentID,
		Count:      count,
		Difficulty: difficulty,
		Threshold:  threshold,
	})
	req, err := http.NewRequest(http.MethodPost, r.BaseURL+"/api/quizzes", bytes.NewReader(body))
	if err != nil {
		return nil, errors.ErrInternalServer
	}
	req.Header.Set("Content-Type", "application/json")
	return r.callQuiz(req)
}

func (r *AIRepository) GetQuiz(id string) (*domain.Quiz, error) {
	req, err := http.NewRequest(http.MethodGet, r.BaseURL+"/api/quizzes/"+id, nil)
	if err != nil {
		return nil, errors.ErrInternalServer
	}
	return r.callQuiz(req)
}

func (r *AIRepository) callQuiz(req *http.Request) (*domain.Quiz, error) {
	resp, err := r.Client.Do(req)
	if err != nil {
		return nil, errors.ErrInternalServer
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, mapStatus(resp)
	}
	var q aiQuiz
	if err := json.NewDecoder(resp.Body).Decode(&q); err != nil {
		return nil, errors.ErrInternalServer
	}
	questions := make([]domain.Question, 0, len(q.Questions))
	for _, qq := range q.Questions {
		expl := ""
		if qq.Explanation != nil {
			expl = *qq.Explanation
		}
		questions = append(questions, domain.Question{
			ID:              qq.ID,
			QuestionText:    qq.QuestionText,
			Choices:         qq.Choices,
			AnswerIndex:     qq.AnswerIndex,
			Explanation:     expl,
			SourceChunkIDs:  qq.SourceChunkIDs,
			ValidationScore: qq.ValidationScore,
		})
	}
	return &domain.Quiz{
		ID: q.ID, DocumentID: q.DocumentID, Status: q.Status, Questions: questions,
	}, nil
}

func mapStatus(resp *http.Response) error {
	body, _ := io.ReadAll(resp.Body)
	msg := string(bytes.TrimSpace(body))
	switch {
	case resp.StatusCode == http.StatusNotFound:
		return errors.ErrNotFound
	case resp.StatusCode == http.StatusBadRequest:
		return &errors.AppError{Code: http.StatusBadRequest, Message: fmt.Sprintf("AI 서버 요청 오류: %s", msg)}
	case resp.StatusCode >= 500:
		return &errors.AppError{Code: http.StatusBadGateway, Message: fmt.Sprintf("AI 서버 오류: %s", msg)}
	default:
		return errors.ErrInternalServer
	}
}
