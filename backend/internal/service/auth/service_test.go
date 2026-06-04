package auth

import (
	"testing"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
)

type mockGateway struct {
	signupFn      func(email, name, password string) (domain.Session, error)
	loginFn       func(email, password string) (domain.Session, error)
	userByTokenFn func(token string) (domain.User, error)
}

func (m *mockGateway) Signup(email, name, password string) (domain.Session, error) {
	return m.signupFn(email, name, password)
}
func (m *mockGateway) Login(email, password string) (domain.Session, error) {
	return m.loginFn(email, password)
}
func (m *mockGateway) UserByToken(token string) (domain.User, error) {
	return m.userByTokenFn(token)
}
func (m *mockGateway) Logout(token string)              {}
func (m *mockGateway) DeleteAccount(token string) error { return nil }

func TestSignup_EmptyEmail(t *testing.T) {
	svc := &Service{}
	_, err := svc.Signup("", "Name", "password")
	if err == nil {
		t.Fatal("expected error for empty email")
	}
}

func TestSignup_EmptyPassword(t *testing.T) {
	svc := &Service{}
	_, err := svc.Signup("test@example.com", "Name", "   ")
	if err == nil {
		t.Fatal("expected error for blank password")
	}
}

func TestSignup_Success(t *testing.T) {
	var gotName string
	svc := &Service{
		Gateway: &mockGateway{
			signupFn: func(email, name, password string) (domain.Session, error) {
				gotName = name
				return domain.Session{Token: "tok", User: domain.User{Email: email, Name: name}}, nil
			},
		},
	}
	session, err := svc.Signup("test@example.com", "  Alice  ", "password")
	if err != nil {
		t.Fatal(err)
	}
	if session.Token != "tok" {
		t.Errorf("expected token=tok, got %q", session.Token)
	}
	if gotName != "Alice" {
		t.Errorf("expected name to be trimmed to %q, got %q", "Alice", gotName)
	}
}

func TestLogin_EmptyEmail(t *testing.T) {
	svc := &Service{}
	_, err := svc.Login("", "password")
	if err == nil {
		t.Fatal("expected error for empty email")
	}
}

func TestLogin_EmptyPassword(t *testing.T) {
	svc := &Service{}
	_, err := svc.Login("test@example.com", "   ")
	if err == nil {
		t.Fatal("expected error for blank password")
	}
}

func TestLogin_Success(t *testing.T) {
	svc := &Service{
		Gateway: &mockGateway{
			loginFn: func(email, password string) (domain.Session, error) {
				return domain.Session{Token: "tok", User: domain.User{Email: email}}, nil
			},
		},
	}
	session, err := svc.Login("test@example.com", "password")
	if err != nil {
		t.Fatal(err)
	}
	if session.Token != "tok" {
		t.Errorf("expected token=tok, got %q", session.Token)
	}
}

func TestMe_EmptyToken(t *testing.T) {
	svc := &Service{}
	_, err := svc.Me("   ")
	if err != apperrors.ErrUnauthorized {
		t.Fatalf("expected ErrUnauthorized, got %v", err)
	}
}

func TestDeleteAccount_EmptyToken(t *testing.T) {
	svc := &Service{}
	err := svc.DeleteAccount("")
	if err != apperrors.ErrUnauthorized {
		t.Fatalf("expected ErrUnauthorized, got %v", err)
	}
}
