package dto

type LoginRequestDTO struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type UserDTO struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

type LoginResponseDTO struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}
