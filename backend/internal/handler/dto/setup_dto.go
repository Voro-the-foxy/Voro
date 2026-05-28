package dto

type SetupStateDTO struct {
	Schedule bool `json:"schedule"`
	Alarm    bool `json:"alarm"`
	Exam     bool `json:"exam"`
	Notes    bool `json:"notes"`
}

type SetupStepRequest struct {
	Step string `json:"step"`
}
