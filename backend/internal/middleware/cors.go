package middleware

import (
	"net/http"
	"strings"
)

// CORS อนุญาตให้เฉพาะหน้าเว็บของเราเรียก API ได้
func CORS(allowedOrigins string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Vary", "Origin")

		if isAllowedOrigin(r.Header.Get("Origin"), allowedOrigins) {
			w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
		}

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func isAllowedOrigin(origin, allowedOrigins string) bool {
	if origin == "" {
		return false
	}

	for _, allowed := range strings.Split(allowedOrigins, ",") {
		allowed = strings.TrimSpace(allowed)
		if allowed == origin {
			return true
		}
		if prefix, suffix, ok := strings.Cut(allowed, "*"); ok &&
			!strings.Contains(suffix, "*") &&
			strings.HasPrefix(origin, prefix) &&
			strings.HasSuffix(origin, suffix) &&
			len(origin) > len(prefix)+len(suffix) {
			return true
		}
	}
	return false
}
