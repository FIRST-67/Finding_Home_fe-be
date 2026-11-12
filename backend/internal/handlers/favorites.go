package handlers

import (
	"net/http"
	"strconv"

	"finding-home/internal/middleware"
	"finding-home/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FavoritesHandler struct {
	DB *pgxpool.Pool
}

func (h *FavoritesHandler) List(w http.ResponseWriter, r *http.Request) {
	identity, _ := middleware.IdentityFrom(r.Context())
	rows, err := h.DB.Query(r.Context(), `SELECT `+dogColumns+` FROM dogs d
  JOIN favorites f ON f.dog_id = d.id WHERE f.user_id = $1 ORDER BY d.id DESC`, identity.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	dogs, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.Dog, error) { return scanDog(row) })
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusOK, dogs)
}

func (h *FavoritesHandler) Create(w http.ResponseWriter, r *http.Request) {
	identity, _ := middleware.IdentityFrom(r.Context())
	var input struct {
		DogID int64 `json:"dog_id"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.DogID < 1 {
		writeError(w, http.StatusBadRequest, "invalid dog_id")
		return
	}

	// Hold a key-share lock so the dog cannot be deleted between the check and the insert.
	var exists bool
	err := h.DB.QueryRow(r.Context(), `WITH dog AS (
  SELECT id FROM dogs WHERE id = $2 FOR KEY SHARE
 ), saved AS (
  INSERT INTO favorites (user_id, dog_id) SELECT $1, id FROM dog
  ON CONFLICT (user_id, dog_id) DO NOTHING
 ) SELECT EXISTS (SELECT 1 FROM dog)`, identity.ID, input.DogID).Scan(&exists)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	if !exists {
		writeError(w, http.StatusNotFound, "dog not found")
		return
	}
	writeJSON(w, http.StatusCreated, input)
}

func (h *FavoritesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("dog_id"), 10, 64)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "invalid dog id")
		return
	}
	identity, _ := middleware.IdentityFrom(r.Context())
	if _, err := h.DB.Exec(r.Context(), "DELETE FROM favorites WHERE user_id = $1 AND dog_id = $2", identity.ID, id); err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
