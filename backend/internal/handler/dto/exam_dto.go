package dto

type ExamDTO struct {
	ID        string `json:"id"`
	ClassName string `json:"class_name"`
	Year      int    `json:"year"`
	Month     int    `json:"month"`
	Day       int    `json:"day"`
	Hour      int    `json:"hour"`
	Minute    int    `json:"minute"`
	Period    string `json:"period"`
	Enabled   bool   `json:"enabled"`
}

type ExamsMasterDTO struct {
	Enabled bool `json:"enabled"`
}
