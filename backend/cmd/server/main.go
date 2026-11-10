package main

import (
	"context"
	"log"
	"net/http"

	"finding-home/internal/config"
	"finding-home/internal/db"
	"finding-home/internal/handlers"
	"finding-home/internal/middleware"
)

func main() {
	cfg := config.Load()

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("cannot connect to database: %v", err)
	}
	defer pool.Close()

	breeds := handlers.NewBreedsHandler(cfg.DogAPIKey)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", handlers.Health)
	mux.HandleFunc("GET /api/db-check", handlers.DBCheck(pool))
	mux.HandleFunc("GET /api/breeds", breeds.List)
	mux.HandleFunc("GET /api/breeds/search", breeds.Search)

	// TODO (แยก branch): auth, dogs CRUD, adoption requests, favorites

	addr := ":" + cfg.Port
	log.Printf("server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, middleware.CORS(cfg.AllowedOrigin, mux)))
}
