package config

import "os"

type Config struct {
	Port          string
	DatabaseURL   string
	DogAPIKey     string
	AllowedOrigin string
}

func Load() Config {
	return Config{
		Port:          get("PORT", "8080"),
		DatabaseURL:   os.Getenv("DATABASE_URL"),
		DogAPIKey:     os.Getenv("DOG_API_KEY"),
		AllowedOrigin: get("ALLOWED_ORIGIN", "http://localhost:5173"),
	}
}

func get(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
