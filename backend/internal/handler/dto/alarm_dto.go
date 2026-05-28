package dto

type AlarmDTO struct {
	ID      string   `json:"id"`
	Hour    int      `json:"hour"`
	Minute  int      `json:"minute"`
	Period  string   `json:"period"`
	Days    []string `json:"days"`
	Enabled bool     `json:"enabled"`
}

type AlarmsMasterDTO struct {
	Enabled bool `json:"enabled"`
}
