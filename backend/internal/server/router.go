package server

import (
	"database/sql"
	"net/http"
	"strings"

	"voro/backend/internal/gateway/ai"
	"voro/backend/internal/gateway/postgres"

	alarmhnd "voro/backend/internal/handler/alarm"
	attempthnd "voro/backend/internal/handler/attempt"
	authhnd "voro/backend/internal/handler/auth"
	classhnd "voro/backend/internal/handler/class"
	examhnd "voro/backend/internal/handler/exam"
	notehnd "voro/backend/internal/handler/note"
	quizhnd "voro/backend/internal/handler/quiz"
	setuphnd "voro/backend/internal/handler/setup"

	"voro/backend/internal/service/alarm"
	"voro/backend/internal/service/attempt"
	"voro/backend/internal/service/auth"
	"voro/backend/internal/service/class"
	"voro/backend/internal/service/exam"
	"voro/backend/internal/service/note"
	"voro/backend/internal/service/quiz"
	"voro/backend/internal/service/setup"
)

// NewHandler builds the full HTTP handler (CORS + router).
// allowedOrigin is the production frontend origin; empty string disables the
// production-origin check (useful in tests).
func NewHandler(db *sql.DB, allowedOrigin string) http.Handler {
	return cors(allowedOrigin, newRouter(db))
}

func newRouter(db *sql.DB) *http.ServeMux {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	authSvc := &auth.Service{Gateway: postgres.NewAuthGateway(db)}

	// protected wraps a handler so it only runs for authenticated requests; the
	// resolved user's ID is injected into the request context (see middleware.go).
	protected := func(h http.HandlerFunc) http.HandlerFunc {
		return requireAuth(authSvc, h)
	}

	authHnd := &authhnd.Handler{Service: authSvc}
	mux.HandleFunc("POST /api/auth/signup", authHnd.Signup)
	mux.HandleFunc("POST /api/auth/login", authHnd.Login)
	mux.HandleFunc("GET /api/auth/me", authHnd.Me)
	mux.HandleFunc("POST /api/auth/logout", authHnd.Logout)
	mux.HandleFunc("DELETE /api/auth/account", authHnd.DeleteAccount)

	classHnd := &classhnd.Handler{Service: &class.Service{Gateway: postgres.NewClassGateway(db)}}
	mux.HandleFunc("GET /api/classes", protected(classHnd.List))
	mux.HandleFunc("PUT /api/classes", protected(classHnd.ReplaceAll))
	mux.HandleFunc("POST /api/classes", protected(classHnd.Add))
	mux.HandleFunc("DELETE /api/classes/{id}", protected(classHnd.Delete))

	noteHnd := &notehnd.Handler{Service: &note.Service{Gateway: postgres.NewNoteGateway(db)}}
	mux.HandleFunc("GET /api/notes", protected(noteHnd.ListByClass))
	mux.HandleFunc("POST /api/notes", protected(noteHnd.Add))
	mux.HandleFunc("DELETE /api/notes/{id}", protected(noteHnd.Delete))
	mux.HandleFunc("DELETE /api/notes", protected(noteHnd.DeleteByClass))

	alarmHnd := &alarmhnd.Handler{Service: &alarm.Service{Gateway: postgres.NewAlarmGateway(db)}}
	mux.HandleFunc("GET /api/alarms", protected(alarmHnd.List))
	mux.HandleFunc("PUT /api/alarms", protected(alarmHnd.ReplaceAll))
	mux.HandleFunc("GET /api/alarms/master", protected(alarmHnd.GetMaster))
	mux.HandleFunc("PUT /api/alarms/master", protected(alarmHnd.SetMaster))

	examHnd := &examhnd.Handler{Service: &exam.Service{Gateway: postgres.NewExamGateway(db)}}
	mux.HandleFunc("GET /api/exams", protected(examHnd.List))
	mux.HandleFunc("PUT /api/exams", protected(examHnd.ReplaceAll))
	mux.HandleFunc("GET /api/exams/master", protected(examHnd.GetMaster))
	mux.HandleFunc("PUT /api/exams/master", protected(examHnd.SetMaster))

	setupHnd := &setuphnd.Handler{Service: &setup.Service{Gateway: postgres.NewSetupGateway(db)}}
	mux.HandleFunc("GET /api/setup", protected(setupHnd.Get))
	mux.HandleFunc("POST /api/setup/steps", protected(setupHnd.MarkStep))

	attemptHnd := &attempthnd.Handler{Service: &attempt.Service{Gateway: postgres.NewAttemptGateway(db)}}
	mux.HandleFunc("GET /api/attempts", protected(attemptHnd.List))
	mux.HandleFunc("GET /api/attempts/{id}", protected(attemptHnd.GetByID))
	mux.HandleFunc("POST /api/attempts", protected(attemptHnd.Save))
	mux.HandleFunc("DELETE /api/attempts", protected(attemptHnd.DeleteByClass))

	// Documents/quizzes are owned by the AI server, which has no per-user
	// partitioning yet — we require auth here but the underlying data is still
	// shared. Per-user isolation of AI-server data is a follow-up.
	quizHnd := &quizhnd.Handler{Service: &quiz.Service{Gateway: ai.NewQuizGateway()}}
	mux.HandleFunc("POST /api/documents", protected(quizHnd.UploadDocument))
	mux.HandleFunc("GET /api/documents", protected(quizHnd.ListDocuments))
	mux.HandleFunc("DELETE /api/documents/{id}", protected(quizHnd.DeleteDocument))
	mux.HandleFunc("POST /api/quizzes", protected(quizHnd.CreateQuiz))
	mux.HandleFunc("GET /api/quizzes/{id}", protected(quizHnd.GetQuiz))

	return mux
}

func cors(allowedOrigin string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if isAllowed(origin, allowedOrigin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Allow-Private-Network", "true")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func isAllowed(origin, allowedOrigin string) bool {
	// Local dev (Vite) and Capacitor WebView origins.
	// Capacitor Android defaults to the https://localhost scheme, iOS to
	// capacitor://localhost — both must be allowed for the native app.
	if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") ||
		strings.HasPrefix(origin, "https://localhost") || strings.HasPrefix(origin, "https://127.0.0.1") {
		return true
	}
	if origin == "capacitor://localhost" {
		return true
	}
	if allowedOrigin == "" {
		return false
	}
	for _, o := range strings.Split(allowedOrigin, ",") {
		if strings.TrimSpace(o) == origin {
			return true
		}
	}
	return false
}
