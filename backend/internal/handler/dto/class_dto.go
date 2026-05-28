package dto

type ClassItemDTO struct {
	ID    string   `json:"id"`
	Name  string   `json:"name"`
	Slots []string `json:"slots"`
}
