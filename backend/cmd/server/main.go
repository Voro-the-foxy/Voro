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

	// 2. Product 도메인 조립 (추가 시 여기에만 작성)
	productRepo := &repository.ProductRepository{}
	productSvc := &service.ProductService{Repo: productRepo}
	productHnd := &handler.ProductHandler{Service: productSvc}
	mux.HandleFunc("GET /api/products", productHnd.GetAllProducts)

	return mux
}

func main() {
	repo := &repository.PlaceRepository{}
	svc := &service.PlaceService{Repo: repo}
	hnd := &handler.PlaceHandler{Service: svc}

	mux := http.NewServeMux()

	mux.HandleFunc("GET /api/stores", hnd.GetAllStores)

	log.Println("서버 시작: 8080")
	if err := http.ListenAndServe(":8080", cors(mux)); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
