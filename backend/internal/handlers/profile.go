package handlers

import (
	"errors"
	"net/http"
	"strings"
	"unicode/utf8"

	"finding-home/internal/middleware"
	"finding-home/internal/models"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func (a *AuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	identity, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}

	var u models.User
	err := a.DB.QueryRow(r.Context(),
		`SELECT id, name, email, phone, role, created_at
		 FROM users WHERE id=$1`, identity.ID,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.CreatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, 401, "unauthorized")
		return
	}
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}

	u.CreatedAt = u.CreatedAt.UTC()
	writeJSON(w, 200, u)
}

func (a *AuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	identity, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}

	var in struct {
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, 400, "invalid request body")
		return
	}

	in.Name = strings.TrimSpace(in.Name)
	in.Phone = strings.TrimSpace(in.Phone)

	if in.Name == "" {
		writeError(w, http.StatusBadRequest, "name is required")
		return
	}
	if utf8.RuneCountInString(in.Name) > 50 {
		writeError(w, 400, "name must be 1-50 characters")
		return
	}
	if len(in.Phone) > 20 {
		writeError(w, 400, "phone is too long")
		return
	}

	var u models.User
	err := a.DB.QueryRow(r.Context(),
		`UPDATE users SET name=$1, phone=$2
		 WHERE id=$3
		 RETURNING id, name, email, phone, role, created_at`,
		in.Name, in.Phone, identity.ID,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Phone, &u.Role, &u.CreatedAt)

	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, 401, "unauthorized")
		return
	}
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}

	u.CreatedAt = u.CreatedAt.UTC()
	writeJSON(w, 200, u)
}

func (a *AuthHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	identity, ok := middleware.IdentityFrom(r.Context())
	if !ok {
		writeError(w, 401, "unauthorized")
		return
	}

	var in struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
	}
	if err := decodeJSON(r, &in); err != nil {
		writeError(w, 400, "invalid request body")
		return
	}

	if utf8.RuneCountInString(in.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "new password must be at least 8 characters")
		return
	}
	if len(in.NewPassword) > 72 {
		writeError(w, 400, "new password must be at most 72 bytes")
		return
	}

	var currentHash string
	err := a.DB.QueryRow(r.Context(),
		`SELECT password_hash FROM users WHERE id=$1`,
		identity.ID,
	).Scan(&currentHash)

	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, 401, "unauthorized")
		return
	}
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}

	if bcrypt.CompareHashAndPassword(
		[]byte(currentHash),
		[]byte(in.CurrentPassword),
	) != nil {
		writeError(w, http.StatusUnauthorized, "current password is incorrect")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword(
		[]byte(in.NewPassword), bcrypt.DefaultCost,
	)
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}

	result, err := a.DB.Exec(r.Context(),
		`UPDATE users SET password_hash=$1 WHERE id=$2 AND password_hash=$3`,
		string(newHash), identity.ID, currentHash,
	)
	if err != nil {
		writeError(w, 500, "internal server error")
		return
	}
	if result.RowsAffected() == 0 {
		writeError(w, http.StatusUnauthorized, "current password is incorrect")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
