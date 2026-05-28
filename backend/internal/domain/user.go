package domain

type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash string
}

type Session struct {
	Token string
	User  User
}
