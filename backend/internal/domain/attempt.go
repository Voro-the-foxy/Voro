package domain

type Attempt struct {
	ID             string
	ClassID        string
	QuizID         string
	LectureTitle   string
	QuestionIDs    []string
	Answers        []int
	CorrectIndices []int
	Score          int
	Total          int
	CompletedAt    int64
}
