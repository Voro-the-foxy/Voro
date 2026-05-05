package domain

type Document struct {
	ID         string
	Title      string
	SourceType string
	ChunkCount int
}

type Question struct {
	ID              string
	QuestionText    string
	Choices         []string
	AnswerIndex     int
	Explanation     string
	SourceChunkIDs  []string
	ValidationScore *float64
}

type Quiz struct {
	ID         string
	DocumentID string
	Status     string
	Questions  []Question
}
