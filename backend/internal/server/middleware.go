package server

import (
	"net/http"
	"strings"

	"voro/backend/internal/domain"
	"voro/backend/internal/shared/authctx"
)

// userResolver resolves a session token to its owning user. *auth.Service
// satisfies this via its Me method.
type userResolver interface {
	Me(token string) (domain.User, error)
}

// requireAuth wraps a handler so it only runs for requests carrying a valid
// "Authorization: Bearer <token>" header. On success the resolved user's ID is
// stored in the request context (see authctx); otherwise it responds 401.
func requireAuth(resolver userResolver, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		token := bearerToken(r)
		if token == "" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		user, err := resolver.Me(token)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		ctx := authctx.WithUserID(r.Context(), user.ID)
		next(w, r.WithContext(ctx))
	}
}

func bearerToken(r *http.Request) string {
	value := r.Header.Get("Authorization")
	token, ok := strings.CutPrefix(value, "Bearer ")
	if !ok {
		return ""
	}
	return strings.TrimSpace(token)
}
