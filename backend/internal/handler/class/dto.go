package class

type ItemDTO struct {
	ID    string   `json:"id"`
	Name  string   `json:"name"`
	Slots []string `json:"slots"`
}
