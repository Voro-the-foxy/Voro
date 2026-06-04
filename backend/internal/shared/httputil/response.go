package httputil

import (
	"encoding/json"
	"net/http"

	"voro/backend/internal/shared/authctx"
	"voro/backend/internal/shared/errors"
)

// UserID returns the authenticated user's ID from the request context. When it
// is absent (a route not behind requireAuth, or an unauthenticated request) it
// writes a 401 and returns ok=false; callers should return immediately.
func UserID(w http.ResponseWriter, r *http.Request) (string, bool) {
	userID, ok := authctx.UserIDFrom(r.Context())
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return "", false
	}
	return userID, true
}

func WriteError(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*errors.AppError); ok {
		http.Error(w, appErr.Message, appErr.Code)
		return
	}
	http.Error(w, err.Error(), http.StatusInternalServerError)
}

func WriteJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}
