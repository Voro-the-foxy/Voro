package server

import (
	"database/sql"
	"net/http"
	"strings"

	httpSwagger "github.com/swaggo/http-swagger"
	_ "voro/backend/docs"
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

const darkThemeScript = `
var s = document.createElement('style');
s.textContent = [
	"body, .swagger-ui { background: #0d0d0d !important; color: #e0e0e0 !important; }",
	".swagger-ui .topbar { background: #000 !important; }",
	".swagger-ui .info .title, .swagger-ui .info p, .swagger-ui .info a { color: #e0e0e0 !important; }",
	".swagger-ui .scheme-container { background: #141414 !important; box-shadow: none !important; }",
	".swagger-ui .opblock-tag { color: #e0e0e0 !important; border-bottom: 1px solid #333 !important; }",
	".swagger-ui .opblock-tag:hover { background: #1a1a1a !important; }",
	".swagger-ui .opblock { background: #1a1a1a !important; border-color: #333 !important; box-shadow: none !important; }",
	".swagger-ui .opblock.opblock-get { border-color: #1f6feb !important; background: #0d1b2e !important; }",
	".swagger-ui .opblock.opblock-post { border-color: #2ea043 !important; background: #0d2015 !important; }",
	".swagger-ui .opblock.opblock-put { border-color: #d29922 !important; background: #2a1f00 !important; }",
	".swagger-ui .opblock.opblock-delete { border-color: #da3633 !important; background: #2a0d0d !important; }",
	".swagger-ui .opblock .opblock-summary { background: transparent !important; }",
	".swagger-ui .opblock .opblock-summary-method { color: #fff !important; }",
	".swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-description { color: #ccc !important; }",
	".swagger-ui .opblock-body, .swagger-ui .opblock-section { background: #111 !important; }",
	".swagger-ui .opblock-body pre.microlight { background: #0d0d0d !important; color: #e0e0e0 !important; }",
	".swagger-ui section.models { background: #141414 !important; border-color: #333 !important; }",
	".swagger-ui section.models h4, .swagger-ui .model-title, .swagger-ui .model { color: #e0e0e0 !important; }",
	".swagger-ui .model-toggle::after { filter: invert(1) !important; }",
	".swagger-ui table thead tr td, .swagger-ui table thead tr th { color: #aaa !important; border-color: #333 !important; }",
	".swagger-ui .parameter__name, .swagger-ui .parameter__type, .swagger-ui .parameter__in { color: #ccc !important; }",
	".swagger-ui .tab li, .swagger-ui .response-col_status, .swagger-ui .response-col_description { color: #ccc !important; }",
	".swagger-ui select, .swagger-ui input[type=text], .swagger-ui textarea { background: #1a1a1a !important; color: #e0e0e0 !important; border-color: #444 !important; }",
	".swagger-ui .btn { background: #1a1a1a !important; color: #e0e0e0 !important; border-color: #444 !important; }",
	".swagger-ui .btn.execute { background: #1f6feb !important; color: #fff !important; border-color: #1f6feb !important; }",
	".swagger-ui .btn.authorize { background: #2ea043 !important; color: #fff !important; border-color: #2ea043 !important; }",
	".swagger-ui .dialog-ux .modal-ux { background: #1a1a1a !important; border-color: #444 !important; }",
	".swagger-ui .dialog-ux .modal-ux-header { background: #141414 !important; border-color: #444 !important; }",
	".swagger-ui .dialog-ux .modal-ux-header h3 { color: #e0e0e0 !important; }",
	".swagger-ui .dialog-ux .modal-ux-content p, .swagger-ui .dialog-ux .modal-ux-content h4 { color: #ccc !important; }",
	".swagger-ui .wrapper { background: #0d0d0d !important; }",
	".swagger-ui .markdown p, .swagger-ui .markdown li { color: #ccc !important; }",
	".swagger-ui .arrow { filter: invert(1) !important; }"
].join(" ");
document.head.appendChild(s);
`

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

	mux.Handle("/api/docs/", httpSwagger.Handler(
		httpSwagger.AfterScript(darkThemeScript),
	))

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
