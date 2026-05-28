package service

import (
	"net/http"
	"strings"

	apperrors "nomilk/backend/internal/shared/errors"

	"nomilk/backend/internal/domain"
)

var ErrMissingCredentials = &apperrors.AppError{Code: http.StatusBadRequest, Message: "이메일과 비밀번호를 입력해주세요"}

type AuthService struct {
	Gateway AuthGateway
}

func (s *AuthService) Login(email string, password string) (domain.Session, error) {
	if strings.TrimSpace(email) == "" || strings.TrimSpace(password) == "" {
		return domain.Session{}, ErrMissingCredentials
	}
	return s.Gateway.Login(email, password)
}

func (s *AuthService) Me(token string) (domain.User, error) {
	if strings.TrimSpace(token) == "" {
		return domain.User{}, apperrors.ErrUnauthorized
	}
	return s.Gateway.UserByToken(token)
}

func (s *AuthService) Logout(token string) {
	if strings.TrimSpace(token) == "" {
		return
	}
	s.Gateway.Logout(token)
}

func (s *AuthService) DeleteAccount(token string) error {
	if strings.TrimSpace(token) == "" {
		return apperrors.ErrUnauthorized
	}
	return s.Gateway.DeleteAccount(token)
}
