package service

import "nomilk/backend/internal/domain"

type AuthGateway interface {
	Login(email, password string) (domain.Session, error)
	UserByToken(token string) (domain.User, error)
	Logout(token string)
	DeleteAccount(token string) error
}
