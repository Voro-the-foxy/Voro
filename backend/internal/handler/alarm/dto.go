package alarm

type DTO struct {
	ID      string   `json:"id"`
	Hour    int      `json:"hour"`
	Minute  int      `json:"minute"`
	Period  string   `json:"period"`
	Days    []string `json:"days"`
	Enabled bool     `json:"enabled"`
}

type MasterDTO struct {
	Enabled bool `json:"enabled"`
}
