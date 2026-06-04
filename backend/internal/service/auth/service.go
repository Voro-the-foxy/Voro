package auth

import (
	"net/http"
	"strings"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

var ErrMissingCredentials = &apperrors.AppError{Code: http.StatusBadRequest, Message: "email and password are required"}

type Service struct {
	Gateway Gateway
}

func (s *Service) Signup(email, name, password string) (domain.Session, error) {
	if strings.TrimSpace(email) == "" || strings.TrimSpace(password) == "" {
		return domain.Session{}, ErrMissingCredentials
	}
	return s.Gateway.Signup(email, strings.TrimSpace(name), password)
}

func (s *Service) Login(email, password string) (domain.Session, error) {
	if strings.TrimSpace(email) == "" || strings.TrimSpace(password) == "" {
		return domain.Session{}, ErrMissingCredentials
	}
	return s.Gateway.Login(email, password)
}

func (s *Service) Me(token string) (domain.User, error) {
	if strings.TrimSpace(token) == "" {
		return domain.User{}, apperrors.ErrUnauthorized
	}
	return s.Gateway.UserByToken(token)
}

func (s *Service) Logout(token string) {
	if strings.TrimSpace(token) == "" {
		return
	}
	s.Gateway.Logout(token)
}

func (s *Service) DeleteAccount(token string) error {
	if strings.TrimSpace(token) == "" {
		return apperrors.ErrUnauthorized
	}
	return s.Gateway.DeleteAccount(token)
}
