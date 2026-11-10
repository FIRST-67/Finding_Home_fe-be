package handlers

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/mail"
	"strings"
	"time"
	"unicode/utf8"

	"finding-home/internal/middleware"
	"finding-home/internal/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB     *pgxpool.Pool
	Secret []byte
}

func NewAuthHandler(db *pgxpool.Pool, secret string) *AuthHandler {
	return &AuthHandler{DB: db, Secret: []byte(secret)}
}
func decodeJSON(r *http.Request, d any) error {
	if r.Body == nil {
		return errors.New("missing body")
	}
	dec := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	dec.DisallowUnknownFields()
	if err := dec.Decode(d); err != nil {
		return err
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		return errors.New("invalid or multiple JSON values")
	}
	return nil
}
func validEmail(s string) bool {
	a, e := mail.ParseAddress(s)
	return e == nil && a.Address == s && !strings.ContainsAny(s, " \t\n")
}
func (a *AuthHandler) token(u models.User) (string, error) {
	now := time.Now()
	return jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{"user_id": u.ID, "role": u.Role, "iat": now.Unix(), "exp": now.Add(24 * time.Hour).Unix()}).SignedString(a.Secret)
}
func (a *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Phone    string `json:"phone"`
	}
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, 400, "invalid request body")
		return
	}
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	in.Phone = strings.TrimSpace(in.Phone)
	if n := utf8.RuneCountInString(in.Name); n < 1 || n > 50 {
		writeError(w, 400, "name must be 1-50 characters")
		return
	}
	if !validEmail(in.Email) || len(in.Email) > 255 {
		writeError(w, 400, "invalid email")
		return
	}
	if len(in.Password) < 8 {
		writeError(w, 400, "password must be at least 8 characters")
		return
	}
	if len([]byte(in.Password)) > 72 {
		writeError(w, 400, "password must be at most 72 bytes")
		return
	}
	if len(in.Phone) > 20 {
		writeError(w, 400, "phone is too long")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(in.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}
	var u models.User
	err = a.DB.QueryRow(r.Context(), `INSERT INTO users (name,email,password_hash,phone,role) VALUES ($1,$2,$3,$4,'member') RETURNING id,name,email,phone,role,created_at`, in.Name, in.Email, string(hash), in.Phone).Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.CreatedAt)
	if err != nil {
		var pe *pgconn.PgError
		if errors.As(err, &pe) && pe.Code == "23505" {
			writeError(w, 409, "email already registered")
			return
		}
		writeError(w, 500, "internal server error")
		return
	}
	token, err := a.token(u)
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}
	writeJSON(w, 201, map[string]any{"token": token, "user": u})
}
func (a *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, 400, "invalid request body")
		return
	}
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	var u models.User
	var hash string
	err := a.DB.QueryRow(r.Context(), `SELECT id,name,email,phone,role,created_at,password_hash FROM users WHERE email=$1`, in.Email).Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.CreatedAt, &hash)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, 401, "invalid email or password")
		return
	}
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(in.Password)) != nil {
		writeError(w, 401, "invalid email or password")
		return
	}
	token, err := a.token(u)
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}
	writeJSON(w, 200, map[string]any{"token": token, "user": u})
}
func (a *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	identity, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}
	var u models.User
	err := a.DB.QueryRow(r.Context(), `SELECT id,name,email,phone,role,created_at FROM users WHERE id=$1`, identity.ID).Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, 401, "unauthorized")
		return
	}
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}
	writeJSON(w, 200, u)
}
func (a *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
