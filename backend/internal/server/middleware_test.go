package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"voro/backend/internal/domain"
	"voro/backend/internal/shared/authctx"
	apperrors "voro/backend/internal/shared/errors"
)

type fakeResolver struct {
	user domain.User
	err  error
}

func (f fakeResolver) Me(token string) (domain.User, error) {
	return f.user, f.err
}

func TestRequireAuth_MissingHeader(t *testing.T) {
	called := false
	h := requireAuth(fakeResolver{}, func(w http.ResponseWriter, r *http.Request) { called = true })

	rec := httptest.NewRecorder()
	h(rec, httptest.NewRequest(http.MethodGet, "/api/classes", nil))

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
	if called {
		t.Error("next handler should not run without a token")
	}
}

func TestRequireAuth_InvalidToken(t *testing.T) {
	called := false
	h := requireAuth(fakeResolver{err: apperrors.ErrInvalidToken}, func(w http.ResponseWriter, r *http.Request) { called = true })

	req := httptest.NewRequest(http.MethodGet, "/api/classes", nil)
	req.Header.Set("Authorization", "Bearer bogus")
	rec := httptest.NewRecorder()
	h(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401, got %d", rec.Code)
	}
	if called {
		t.Error("next handler should not run for an invalid token")
	}
}

func TestRequireAuth_InjectsUserID(t *testing.T) {
	var gotUserID string
	var ok bool
	h := requireAuth(fakeResolver{user: domain.User{ID: "user_abc"}}, func(w http.ResponseWriter, r *http.Request) {
		gotUserID, ok = authctx.UserIDFrom(r.Context())
	})

	req := httptest.NewRequest(http.MethodGet, "/api/classes", nil)
	req.Header.Set("Authorization", "Bearer good")
	rec := httptest.NewRecorder()
	h(rec, req)

	if !ok {
		t.Fatal("expected userID to be present in context")
	}
	if gotUserID != "user_abc" {
		t.Errorf("expected userID=user_abc, got %q", gotUserID)
	}
}
