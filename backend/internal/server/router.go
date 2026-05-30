package server

import (
	"database/sql"
	"net/http"
	"strings"

	"voro/backend/internal/gateway/ai"
	"voro/backend/internal/gateway/postgres"

	alarmhnd   "voro/backend/internal/handler/alarm"
	attempthnd "voro/backend/internal/handler/attempt"
	authhnd    "voro/backend/internal/handler/auth"
	classhnd   "voro/backend/internal/handler/class"
	examhnd    "voro/backend/internal/handler/exam"
	notehnd    "voro/backend/internal/handler/note"
	quizhnd    "voro/backend/internal/handler/quiz"
	setuphnd   "voro/backend/internal/handler/setup"

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

	authHnd := &authhnd.Handler{Service: &auth.Service{Gateway: postgres.NewAuthGateway(db)}}
	mux.HandleFunc("POST /api/auth/login", authHnd.Login)
	mux.HandleFunc("GET /api/auth/me", authHnd.Me)
	mux.HandleFunc("POST /api/auth/logout", authHnd.Logout)
	mux.HandleFunc("DELETE /api/auth/account", authHnd.DeleteAccount)

	classHnd := &classhnd.Handler{Service: &class.Service{Gateway: postgres.NewClassGateway(db)}}
	mux.HandleFunc("GET /api/classes", classHnd.List)
	mux.HandleFunc("PUT /api/classes", classHnd.ReplaceAll)
	mux.HandleFunc("POST /api/classes", classHnd.Add)
	mux.HandleFunc("DELETE /api/classes/{id}", classHnd.Delete)

	noteHnd := &notehnd.Handler{Service: &note.Service{Gateway: postgres.NewNoteGateway(db)}}
	mux.HandleFunc("GET /api/notes", noteHnd.ListByClass)
	mux.HandleFunc("POST /api/notes", noteHnd.Add)
	mux.HandleFunc("DELETE /api/notes/{id}", noteHnd.Delete)
	mux.HandleFunc("DELETE /api/notes", noteHnd.DeleteByClass)

	alarmHnd := &alarmhnd.Handler{Service: &alarm.Service{Gateway: postgres.NewAlarmGateway(db)}}
	mux.HandleFunc("GET /api/alarms", alarmHnd.List)
	mux.HandleFunc("PUT /api/alarms", alarmHnd.ReplaceAll)
	mux.HandleFunc("GET /api/alarms/master", alarmHnd.GetMaster)
	mux.HandleFunc("PUT /api/alarms/master", alarmHnd.SetMaster)

	examHnd := &examhnd.Handler{Service: &exam.Service{Gateway: postgres.NewExamGateway(db)}}
	mux.HandleFunc("GET /api/exams", examHnd.List)
	mux.HandleFunc("PUT /api/exams", examHnd.ReplaceAll)
	mux.HandleFunc("GET /api/exams/master", examHnd.GetMaster)
	mux.HandleFunc("PUT /api/exams/master", examHnd.SetMaster)

	setupHnd := &setuphnd.Handler{Service: &setup.Service{Gateway: postgres.NewSetupGateway(db)}}
	mux.HandleFunc("GET /api/setup", setupHnd.Get)
	mux.HandleFunc("POST /api/setup/steps", setupHnd.MarkStep)

	attemptHnd := &attempthnd.Handler{Service: &attempt.Service{Gateway: postgres.NewAttemptGateway(db)}}
	mux.HandleFunc("GET /api/attempts", attemptHnd.List)
	mux.HandleFunc("GET /api/attempts/{id}", attemptHnd.GetByID)
	mux.HandleFunc("POST /api/attempts", attemptHnd.Save)
	mux.HandleFunc("DELETE /api/attempts", attemptHnd.DeleteByClass)

	quizHnd := &quizhnd.Handler{Service: &quiz.Service{Gateway: ai.NewQuizGateway()}}
	mux.HandleFunc("POST /api/documents", quizHnd.UploadDocument)
	mux.HandleFunc("GET /api/documents", quizHnd.ListDocuments)
	mux.HandleFunc("DELETE /api/documents/{id}", quizHnd.DeleteDocument)
	mux.HandleFunc("POST /api/quizzes", quizHnd.CreateQuiz)
	mux.HandleFunc("GET /api/quizzes/{id}", quizHnd.GetQuiz)

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
	if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
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
