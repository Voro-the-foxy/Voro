package setup

type StateDTO struct {
	Schedule bool `json:"schedule"`
	Alarm    bool `json:"alarm"`
	Exam     bool `json:"exam"`
	Notes    bool `json:"notes"`
}

type StepRequest struct {
	Step string `json:"step"`
}
