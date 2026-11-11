package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"finding-home/internal/config"
	"finding-home/internal/db"
	"finding-home/internal/handlers"
	"finding-home/internal/middleware"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}
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
	secret := os.Getenv("JWT_SECRET")
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET must be at least 32 characters")
	}
	auth := handlers.NewAuthHandler(pool, secret)
	dogs := handlers.NewDogsHandler(pool)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", handlers.Health)
	mux.HandleFunc("GET /api/db-check", handlers.DBCheck(pool))
	mux.HandleFunc("GET /api/breeds", breeds.List)
	mux.HandleFunc("GET /api/breeds/search", breeds.Search)

	mux.HandleFunc("POST /api/auth/register", auth.Register)
	mux.HandleFunc("POST /api/auth/login", auth.Login)
	mux.HandleFunc("GET /api/auth/me", middleware.RequireAuth([]byte(secret), auth.Me))
	mux.HandleFunc("POST /api/auth/logout", middleware.RequireAuth([]byte(secret), auth.Logout))

	mux.HandleFunc("GET /api/profile", middleware.RequireAuth([]byte(secret), auth.GetProfile))
	mux.HandleFunc("PUT /api/profile", middleware.RequireAuth([]byte(secret), auth.UpdateProfile))
	mux.HandleFunc("PUT /api/profile/password", middleware.RequireAuth([]byte(secret), auth.ChangePassword))

	mux.HandleFunc("GET /api/dogs", dogs.List)
	mux.HandleFunc("GET /api/dogs/{id}", dogs.Get)

	mux.HandleFunc("POST /api/dogs",
		middleware.RequireAuth([]byte(secret),
			middleware.RequireRole("admin", dogs.Create)))

	mux.HandleFunc("PUT /api/dogs/{id}",
		middleware.RequireAuth([]byte(secret),
			middleware.RequireRole("admin", dogs.Update)))

	mux.HandleFunc("DELETE /api/dogs/{id}",
		middleware.RequireAuth([]byte(secret),
			middleware.RequireRole("admin", dogs.Delete)))

	// TODO: dogs CRUD, adoption requests, favorites

	addr := ":" + cfg.Port
	log.Printf("server listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, middleware.CORS(cfg.AllowedOrigin, mux)))
}
