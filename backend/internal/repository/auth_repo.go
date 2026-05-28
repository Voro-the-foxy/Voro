package repository

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"

	"nomilk/backend/internal/domain"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidToken       = errors.New("invalid token")
)

type AuthRepository struct {
	db *sql.DB
}

func NewAuthRepository(db *sql.DB) *AuthRepository {
	r := &AuthRepository{db: db}
	r.seedUser("demo@voro.app", "voro1234", "Voro Learner")
	return r
}

func (r *AuthRepository) Login(email, password string) (domain.Session, error) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	hash := hashPassword(password)

	var user domain.User
	err := r.db.QueryRow(
		`SELECT id, email, name FROM users WHERE email=$1 AND password_hash=$2`,
		normalizedEmail, hash,
	).Scan(&user.ID, &user.Email, &user.Name)
	if err == sql.ErrNoRows {
		return domain.Session{}, ErrInvalidCredentials
	}
	if err != nil {
		return domain.Session{}, err
	}

	token, err := newToken()
	if err != nil {
		return domain.Session{}, err
	}
	if _, err := r.db.Exec(`INSERT INTO sessions(token, user_email) VALUES($1,$2)`, token, normalizedEmail); err != nil {
		return domain.Session{}, err
	}
	return domain.Session{Token: token, User: user}, nil
}

func (r *AuthRepository) UserByToken(token string) (domain.User, error) {
	var user domain.User
	err := r.db.QueryRow(`
		SELECT u.id, u.email, u.name
		FROM sessions s JOIN users u ON s.user_email = u.email
		WHERE s.token=$1`, token,
	).Scan(&user.ID, &user.Email, &user.Name)
	if err == sql.ErrNoRows {
		return domain.User{}, ErrInvalidToken
	}
	return user, err
}

func (r *AuthRepository) Logout(token string) {
	r.db.Exec(`DELETE FROM sessions WHERE token=$1`, token)
}

func (r *AuthRepository) DeleteAccount(token string) error {
	var email string
	err := r.db.QueryRow(`SELECT user_email FROM sessions WHERE token=$1`, token).Scan(&email)
	if err == sql.ErrNoRows {
		return ErrInvalidToken
	}
	if err != nil {
		return err
	}
	_, err = r.db.Exec(`DELETE FROM users WHERE email=$1`, email)
	return err
}

func (r *AuthRepository) seedUser(email, password, name string) {
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	r.db.Exec(`
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
