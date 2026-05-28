package dto

type AttemptDTO struct {
	ID             string   `json:"id"`
	ClassID        string   `json:"class_id"`
	QuizID         string   `json:"quiz_id"`
	LectureTitle   string   `json:"lecture_title"`
	QuestionIDs    []string `json:"question_ids"`
	Answers        []int    `json:"answers"`
	CorrectIndices []int    `json:"correct_indices"`
	Score          int      `json:"score"`
	Total          int      `json:"total"`
	CompletedAt    int64    `json:"completed_at"`
}

type AttemptCreateRequest struct {
	ClassID        string   `json:"class_id"`
	QuizID         string   `json:"quiz_id"`
	LectureTitle   string   `json:"lecture_title"`
	QuestionIDs    []string `json:"question_ids"`
	Answers        []int    `json:"answers"`
	CorrectIndices []int    `json:"correct_indices"`
	Score          int      `json:"score,omitempty"`
	Total          int      `json:"total,omitempty"`
}
