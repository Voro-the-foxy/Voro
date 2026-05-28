package domain

type Alarm struct {
	ID      string
	Hour    int
	Minute  int
	Period  string
	Days    []string
	Enabled bool
}
