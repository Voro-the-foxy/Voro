package service

import (
	"errors"
	"strings"

	"nomilk/backend/internal/domain"
	"nomilk/backend/internal/repository"
)

var ErrMissingCredentials = errors.New("email and password are required")

type AuthService struct {
	Repo *repository.AuthRepository
}

func (s *AuthService) Login(email string, password string) (domain.Session, error) {
	if strings.TrimSpace(email) == "" || strings.TrimSpace(password) == "" {
		return domain.Session{}, ErrMissingCredentials
	}
	return s.Repo.Login(email, password)
}

func (s *AuthService) Me(token string) (domain.User, error) {
	if strings.TrimSpace(token) == "" {
		return domain.User{}, repository.ErrInvalidToken
	}
	return s.Repo.UserByToken(token)
}

func (s *AuthService) Logout(token string) {
	if strings.TrimSpace(token) == "" {
		return
	}
	s.Repo.Logout(token)
}

func (s *AuthService) DeleteAccount(token string) error {
	if strings.TrimSpace(token) == "" {
		return repository.ErrInvalidToken
	}
	return s.Repo.DeleteAccount(token)
}
