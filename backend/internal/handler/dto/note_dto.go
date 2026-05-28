package dto

type NoteDTO struct {
	ID         string `json:"id"`
	ClassID    string `json:"class_id"`
	Filename   string `json:"filename"`
	Size       int64  `json:"size"`
	AddedAt    int64  `json:"added_at"`
	DocumentID string `json:"document_id,omitempty"`
}

type NoteCreateRequest struct {
	ClassID    string `json:"class_id"`
	Filename   string `json:"filename"`
	Size       int64  `json:"size"`
	DocumentID string `json:"document_id,omitempty"`
}
