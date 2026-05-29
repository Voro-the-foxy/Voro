package quiz

type DocumentDTO struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	SourceType string `json:"source_type"`
	ChunkCount int    `json:"chunk_count"`
}

type QuestionDTO struct {
	ID              string   `json:"id"`
	QuestionText    string   `json:"question_text"`
	Choices         []string `json:"choices"`
	AnswerIndex     int      `json:"answer_index"`
	Explanation     string   `json:"explanation"`
	SourceChunkIDs  []string `json:"source_chunk_ids"`
	ValidationScore *float64 `json:"validation_score"`
}

type QuizDTO struct {
	ID         string        `json:"id"`
	DocumentID string        `json:"document_id"`
	Status     string        `json:"status"`
	Questions  []QuestionDTO `json:"questions"`
}

type CreateRequest struct {
	DocumentID string  `json:"document_id"`
	Count      int     `json:"count"`
	Difficulty string  `json:"difficulty"`
	Threshold  float64 `json:"threshold"`
}
