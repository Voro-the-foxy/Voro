package main

import (
	"log"
	"net/http"
	"nomilk/backend/internal/handler"
	"nomilk/backend/internal/repository"
	"nomilk/backend/internal/service"
)

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "http://localhost:5173" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func setupRouter() *http.ServeMux {
	mux := http.NewServeMux()

	// 1. Place 도메인 조립
	placeRepo := &repository.PlaceRepository{}
	placeSvc := &service.PlaceService{Repo: placeRepo}
	placeHnd := &handler.PlaceHandler{Service: placeSvc}
	mux.HandleFunc("GET /api/stores", placeHnd.GetAllStores)

	// 2. Product 도메인 조립
	productRepo := &repository.ProductRepository{}
	productSvc := &service.ProductService{Repo: productRepo}
	productHnd := &handler.ProductHandler{Service: productSvc}
	mux.HandleFunc("GET /api/products", productHnd.GetAllProducts)

	// 3. Quiz 도메인 조립 (AI 서버 프록시)
	aiRepo := repository.NewAIRepository()
	quizSvc := &service.QuizService{Repo: aiRepo}
	quizHnd := &handler.QuizHandler{Service: quizSvc}
	mux.HandleFunc("POST /api/documents", quizHnd.UploadDocument)
	mux.HandleFunc("GET /api/documents", quizHnd.ListDocuments)
	mux.HandleFunc("POST /api/quizzes", quizHnd.CreateQuiz)
	mux.HandleFunc("GET /api/quizzes/{id}", quizHnd.GetQuiz)

	return mux
}

func main() {
	log.Println("서버 시작: 8080")
	if err := http.ListenAndServe(":8080", cors(setupRouter())); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
