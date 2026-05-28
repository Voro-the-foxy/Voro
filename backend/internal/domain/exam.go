package domain

type Exam struct {
	ID        string
	ClassName string
	Year      int
	Month     int
	Day       int
	Hour      int
	Minute    int
	Period    string
	Enabled   bool
}
