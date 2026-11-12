package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCORSAllowsConfiguredAndPreviewOrigins(t *testing.T) {
	allowedOrigins := "https://finding-home-fe-be.vercel.app, https://finding-home-fe-*.vercel.app"
	handler := CORS(allowedOrigins, http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	for _, origin := range []string{
		"https://finding-home-fe-be.vercel.app",
		"https://finding-home-fe-gyndp1eyc-first1-0975.vercel.app",
	} {
		t.Run(origin, func(t *testing.T) {
			request := httptest.NewRequest(http.MethodGet, "/", nil)
			request.Header.Set("Origin", origin)
			response := httptest.NewRecorder()

			handler.ServeHTTP(response, request)

			if got := response.Header().Get("Access-Control-Allow-Origin"); got != origin {
				t.Fatalf("Access-Control-Allow-Origin = %q, want %q", got, origin)
			}
		})
	}
}

func TestCORSRejectsUnconfiguredOrigin(t *testing.T) {
	handler := CORS("https://finding-home-fe-*.vercel.app", http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	request := httptest.NewRequest(http.MethodOptions, "/", nil)
	request.Header.Set("Origin", "https://other-project.vercel.app")
	response := httptest.NewRecorder()

	handler.ServeHTTP(response, request)

	if got := response.Header().Get("Access-Control-Allow-Origin"); got != "" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want empty", got)
	}
}
