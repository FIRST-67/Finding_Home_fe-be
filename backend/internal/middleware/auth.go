package middleware

import (
	"context"
	"encoding/json"
	"github.com/golang-jwt/jwt/v5"
	"net/http"
	"strings"
)

type authKey struct{}
type Identity struct {
	ID   int64
	Role string
}

func IdentityFrom(ctx context.Context) (Identity, bool) {
	v, ok := ctx.Value(authKey{}).(Identity)
	return v, ok
}
func RequireAuth(secret []byte, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fail := func(status int) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(status)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": map[int]string{401: "unauthorized", 403: "forbidden"}[status]})
		}
		h := r.Header.Get("Authorization")
		if !strings.HasPrefix(h, "Bearer ") {
			fail(401)
			return
		}
		raw := strings.TrimSpace(strings.TrimPrefix(h, "Bearer "))
		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) { return secret, nil }, jwt.WithValidMethods([]string{"HS256"}), jwt.WithExpirationRequired(), jwt.WithIssuedAt())
		if err != nil || !token.Valid {
			fail(401)
			return
		}
		idFloat, ok := claims["user_id"].(float64)
		if !ok || idFloat < 1 || idFloat != float64(int64(idFloat)) {
			fail(401)
			return
		}
		role, ok := claims["role"].(string)
		if !ok || (role != "member" && role != "admin") {
			fail(401)
			return
		}
		next(w, r.WithContext(context.WithValue(r.Context(), authKey{}, Identity{ID: int64(idFloat), Role: role})))
	}
}
