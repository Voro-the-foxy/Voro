package postgres

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"strings"

	"voro/backend/internal/domain"
	apperrors "voro/backend/internal/shared/errors"
	"voro/backend/internal/shared/gen"
)

type AuthGateway struct {
	db *sql.DB
}

func NewAuthGateway(db *sql.DB) *AuthGateway {
	g := &AuthGateway{db: db}
	g.seedUser("demo@voro.app", "voro1234", "Voro Learner")
	return g
}

func (g *AuthGateway) Signup(email, name, password string) (domain.Session, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	if name == "" {
		name = normalizedEmail
	}

	user := domain.User{ID: "user_" + gen.NewID(), Email: normalizedEmail, Name: name}
	res, err := g.db.Exec(`
		INSERT INTO users(id, email, name, password_hash)
		VALUES($1,$2,$3,$4)
		ON CONFLICT(email) DO NOTHING`,
		user.ID, normalizedEmail, name, hashPassword(password),
	)
	if err != nil {
		return domain.Session{}, apperrors.ErrInternalServer
	}
	if affected, _ := res.RowsAffected(); affected == 0 {
		return domain.Session{}, apperrors.ErrEmailTaken
	}

	token, err := newToken()
	if err != nil {
		return domain.Session{}, apperrors.ErrInternalServer
	}
	if _, err := g.db.Exec(`INSERT INTO sessions(token, user_email) VALUES($1,$2)`, token, normalizedEmail); err != nil {
		return domain.Session{}, apperrors.ErrInternalServer
	}
	return domain.Session{Token: token, User: user}, nil
}

func (g *AuthGateway) Login(email, password string) (domain.Session, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	hash := hashPassword(password)

	var user domain.User
	err := g.db.QueryRow(
		`SELECT id, email, name FROM users WHERE email=$1 AND password_hash=$2`,
		normalizedEmail, hash,
	).Scan(&user.ID, &user.Email, &user.Name)
	if err == sql.ErrNoRows {
		return domain.Session{}, apperrors.ErrInvalidCredentials
	}
	if err != nil {
		return domain.Session{}, apperrors.ErrInternalServer
	}

	token, err := newToken()
	if err != nil {
		return domain.Session{}, apperrors.ErrInternalServer
	}
	if _, err := g.db.Exec(`INSERT INTO sessions(token, user_email) VALUES($1,$2)`, token, normalizedEmail); err != nil {
		return domain.Session{}, apperrors.ErrInternalServer
	}
	return domain.Session{Token: token, User: user}, nil
}

func (g *AuthGateway) UserByToken(token string) (domain.User, error) {
	var user domain.User
	err := g.db.QueryRow(`
		SELECT u.id, u.email, u.name
		FROM sessions s JOIN users u ON s.user_email = u.email
		WHERE s.token=$1`, token,
	).Scan(&user.ID, &user.Email, &user.Name)
	if err == sql.ErrNoRows {
		return domain.User{}, apperrors.ErrInvalidToken
	}
	if err != nil {
		return domain.User{}, apperrors.ErrInternalServer
	}
	return user, nil
}

func (g *AuthGateway) Logout(token string) {
	g.db.Exec(`DELETE FROM sessions WHERE token=$1`, token)
}

func (g *AuthGateway) DeleteAccount(token string) error {
	var email string
	err := g.db.QueryRow(`SELECT user_email FROM sessions WHERE token=$1`, token).Scan(&email)
	if err == sql.ErrNoRows {
		return apperrors.ErrInvalidToken
	}
	if err != nil {
		return apperrors.ErrInternalServer
	}
	if _, err = g.db.Exec(`DELETE FROM users WHERE email=$1`, email); err != nil {
		return apperrors.ErrInternalServer
	}
	return nil
}

func (g *AuthGateway) seedUser(email, password, name string) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	g.db.Exec(`
		INSERT INTO users(id, email, name, password_hash)
		VALUES('user_demo', $1, $2, $3)
		ON CONFLICT(email) DO NOTHING`,
		normalizedEmail, name, hashPassword(password),
	)
}

func hashPassword(password string) string {
	sum := sha256.Sum256([]byte(password))
	return hex.EncodeToString(sum[:])
}

func newToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
