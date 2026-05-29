package auth

import "voro/backend/internal/domain"

type Gateway interface {
	Login(email, password string) (domain.Session, error)
	UserByToken(token string) (domain.User, error)
	Logout(token string)
	DeleteAccount(token string) error
}
