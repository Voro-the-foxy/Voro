package main

import (
	"database/sql"
	"log"
	"net/http"
	"nomilk/backend/internal/gateway/ai"
	"nomilk/backend/internal/gateway/postgres"
	"nomilk/backend/internal/handler"
	"nomilk/backend/internal/service"
	"os"
	"strings"
)

func isAllowedOrigin(origin string) bool {
	// localhost / 127.0.0.1 (any port) — safe for local dev
	if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
		return true
	}
	// Capacitor
	return origin == "capacitor://localhost" || origin == "http://localhost"
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if isAllowedOrigin(origin) {
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

func setupRouter(db *sql.DB) *http.ServeMux {
	mux := http.NewServeMux()

	// Auth
	authGw := postgres.NewAuthGateway(db)
	authSvc := &service.AuthService{Gateway: authGw}
	authHnd := &handler.AuthHandler{Service: authSvc}
	mux.HandleFunc("POST /api/auth/login", authHnd.Login)
	mux.HandleFunc("GET /api/auth/me", authHnd.Me)
	mux.HandleFunc("POST /api/auth/logout", authHnd.Logout)
	mux.HandleFunc("DELETE /api/auth/account", authHnd.DeleteAccount)

	// Classes
	classGw := postgres.NewClassGateway(db)
	classSvc := &service.ClassService{Gateway: classGw}
	classHnd := &handler.ClassHandler{Service: classSvc}
	mux.HandleFunc("GET /api/classes", classHnd.List)
	mux.HandleFunc("PUT /api/classes", classHnd.ReplaceAll)
	mux.HandleFunc("POST /api/classes", classHnd.Add)
	mux.HandleFunc("DELETE /api/classes/{id}", classHnd.Delete)

	// Notes
	noteGw := postgres.NewNoteGateway(db)
	noteSvc := &service.NoteService{Gateway: noteGw}
	noteHnd := &handler.NoteHandler{Service: noteSvc}
	mux.HandleFunc("GET /api/notes", noteHnd.ListByClass)
	mux.HandleFunc("POST /api/notes", noteHnd.Add)
	mux.HandleFunc("DELETE /api/notes/{id}", noteHnd.Delete)
	mux.HandleFunc("DELETE /api/notes", noteHnd.DeleteByClass)

	// Alarms
	alarmGw := postgres.NewAlarmGateway(db)
	alarmSvc := &service.AlarmService{Gateway: alarmGw}
	alarmHnd := &handler.AlarmHandler{Service: alarmSvc}
	mux.HandleFunc("GET /api/alarms", alarmHnd.List)
	mux.HandleFunc("PUT /api/alarms", alarmHnd.ReplaceAll)
	mux.HandleFunc("GET /api/alarms/master", alarmHnd.GetMaster)
	mux.HandleFunc("PUT /api/alarms/master", alarmHnd.SetMaster)

	// Exams
	examGw := postgres.NewExamGateway(db)
	examSvc := &service.ExamService{Gateway: examGw}
	examHnd := &handler.ExamHandler{Service: examSvc}
	mux.HandleFunc("GET /api/exams", examHnd.List)
	mux.HandleFunc("PUT /api/exams", examHnd.ReplaceAll)
	mux.HandleFunc("GET /api/exams/master", examHnd.GetMaster)
	mux.HandleFunc("PUT /api/exams/master", examHnd.SetMaster)

	// Setup
	setupGw := postgres.NewSetupGateway(db)
	setupSvc := &service.SetupService{Gateway: setupGw}
	setupHnd := &handler.SetupHandler{Service: setupSvc}
	mux.HandleFunc("GET /api/setup", setupHnd.Get)
	mux.HandleFunc("POST /api/setup/steps", setupHnd.MarkStep)

	// Attempts
	attemptGw := postgres.NewAttemptGateway(db)
	attemptSvc := &service.AttemptService{Gateway: attemptGw}
	attemptHnd := &handler.AttemptHandler{Service: attemptSvc}
	mux.HandleFunc("GET /api/attempts", attemptHnd.List)
	mux.HandleFunc("GET /api/attempts/{id}", attemptHnd.GetByID)
	mux.HandleFunc("POST /api/attempts", attemptHnd.Save)
	mux.HandleFunc("DELETE /api/attempts", attemptHnd.DeleteByClass)

	// Quiz (AI proxy)
	aiGw := ai.NewQuizGateway()
	quizSvc := &service.QuizService{Gateway: aiGw}
	quizHnd := &handler.QuizHandler{Service: quizSvc}
	mux.HandleFunc("POST /api/documents", quizHnd.UploadDocument)
	mux.HandleFunc("GET /api/documents", quizHnd.ListDocuments)
	mux.HandleFunc("DELETE /api/documents/{id}", quizHnd.DeleteDocument)
	mux.HandleFunc("POST /api/quizzes", quizHnd.CreateQuiz)
	mux.HandleFunc("GET /api/quizzes/{id}", quizHnd.GetQuiz)

	return mux
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://voro:voro@localhost:5433/voro?sslmode=disable"
	}

	db, err := postgres.Open(dsn)
	if err != nil {
		log.Fatalf("DB 연결 실패: %v", err)
	}
	defer db.Close()

	if err := postgres.ApplyMigrations(db); err != nil {
		log.Fatalf("마이그레이션 실패: %v", err)
	}

	log.Println("서버 시작: 8080")
	if err := http.ListenAndServe(":8080", cors(setupRouter(db))); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
