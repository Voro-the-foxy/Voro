package auth

import "voro/backend/internal/domain"

type Gateway interface {
	Signup(email, name, password string) (domain.Session, error)
	Login(email, password string) (domain.Session, error)
	UserByToken(token string) (domain.User, error)
	Logout(token string)
	DeleteAccount(token string) error
}
