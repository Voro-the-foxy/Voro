// Package authctx carries the authenticated user's ID through the request
// context. The auth middleware stores it; handlers read it to scope data to
// the current user.
package authctx

import "context"

type ctxKey struct{}

// WithUserID returns a copy of ctx that carries the given user ID.
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, ctxKey{}, userID)
}

// UserIDFrom extracts the user ID stored by the auth middleware. The boolean is
// false when the request was not authenticated.
func UserIDFrom(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(ctxKey{}).(string)
	if !ok || userID == "" {
		return "", false
	}
	return userID, true
}
