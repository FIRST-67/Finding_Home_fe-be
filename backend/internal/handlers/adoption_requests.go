package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"finding-home/internal/middleware"
	"finding-home/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AdoptionRequestsHandler struct {
	DB *pgxpool.Pool
}

const adoptionColumns = `a.id, a.dog_id, d.name, d.image_url, a.user_id, u.name,
 a.message, a.status, a.created_at, a.updated_at`
const adoptionJoins = ` JOIN dogs d ON d.id = a.dog_id JOIN users u ON u.id = a.user_id`

func scanAdoption(row pgx.Row) (models.AdoptionRequest, error) {
	var item models.AdoptionRequest
	err := row.Scan(&item.ID, &item.DogID, &item.DogName, &item.DogImageURL, &item.UserID,
		&item.UserName, &item.Message, &item.Status, &item.CreatedAt, &item.UpdatedAt)
	item.CreatedAt = item.CreatedAt.UTC()
	item.UpdatedAt = item.UpdatedAt.UTC()
	return item, err
}

func (h *AdoptionRequestsHandler) Create(w http.ResponseWriter, r *http.Request) {
	identity, _ := middleware.IdentityFrom(r.Context())
	var input struct {
		DogID   int64  `json:"dog_id"`
		Message string `json:"message"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.DogID < 1 {
		writeError(w, http.StatusBadRequest, "invalid dog_id")
		return
	}
	input.Message = strings.TrimSpace(input.Message)
	if input.Message == "" {
		writeError(w, http.StatusBadRequest, "message is required")
		return
	}

	ctx := r.Context()
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	defer tx.Rollback(ctx)

	// Creation and review lock the dog first, so new requests cannot slip past approval.
	var dogStatus string
	err = tx.QueryRow(ctx, "SELECT status FROM dogs WHERE id = $1 FOR UPDATE", input.DogID).Scan(&dogStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "dog not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	if dogStatus != "available" {
		writeError(w, http.StatusConflict, "dog is not available")
		return
	}

	item, err := scanAdoption(tx.QueryRow(ctx, `WITH created AS (
  INSERT INTO adoption_requests (dog_id, user_id, message) VALUES ($1, $2, $3)
  ON CONFLICT (user_id, dog_id) WHERE status = 'pending' DO NOTHING
  RETURNING *
 ) SELECT `+adoptionColumns+` FROM created a`+adoptionJoins, input.DogID, identity.ID, input.Message))
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusConflict, "you already have a pending request")
		return
	}
	if err != nil || tx.Commit(ctx) != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusCreated, item)
}

func (h *AdoptionRequestsHandler) ListMine(w http.ResponseWriter, r *http.Request) {
	identity, _ := middleware.IdentityFrom(r.Context())
	rows, err := h.DB.Query(r.Context(), `SELECT `+adoptionColumns+` FROM adoption_requests a`+adoptionJoins+
		` WHERE a.user_id = $1 ORDER BY a.created_at DESC, a.id DESC`, identity.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	items, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.AdoptionRequest, error) { return scanAdoption(row) })
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *AdoptionRequestsHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "invalid request id")
		return
	}
	identity, _ := middleware.IdentityFrom(r.Context())
	ctx := r.Context()
	tag, err := h.DB.Exec(ctx, `UPDATE adoption_requests SET status = 'cancelled', updated_at = now()
  WHERE id = $1 AND user_id = $2 AND status = 'pending'`, id, identity.ID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	if tag.RowsAffected() != 0 {
		w.WriteHeader(http.StatusNoContent)
		return
	}

	var owner int64
	err = h.DB.QueryRow(ctx, "SELECT user_id FROM adoption_requests WHERE id = $1", id).Scan(&owner)
	switch {
	case errors.Is(err, pgx.ErrNoRows):
		writeError(w, http.StatusNotFound, "request not found")
	case err != nil:
		writeError(w, http.StatusInternalServerError, "database error")
	case owner != identity.ID:
		writeError(w, http.StatusForbidden, "not your request")
	default:
		writeError(w, http.StatusConflict, "only pending requests can be cancelled")
	}
}

func (h *AdoptionRequestsHandler) List(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	page, err := positiveQuery(query.Get("page"), 1, 1000000)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid page")
		return
	}
	limit, err := positiveQuery(query.Get("limit"), 12, 50)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid limit")
		return
	}
	status := query.Get("status")
	switch status {
	case "", "pending", "approved", "rejected", "cancelled":
	default:
		writeError(w, http.StatusBadRequest, "invalid status")
		return
	}

	ctx := r.Context()
	tx, err := h.DB.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	defer tx.Rollback(ctx)
	const filter = ` WHERE ($1::text = '' OR a.status = $1)`
	var total int64
	err = tx.QueryRow(ctx, `SELECT count(*) FROM adoption_requests a`+filter, status).Scan(&total)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	rows, err := tx.Query(ctx, `SELECT `+adoptionColumns+` FROM adoption_requests a`+adoptionJoins+filter+
		` ORDER BY a.created_at DESC, a.id DESC LIMIT $2 OFFSET $3`, status, limit, (page-1)*limit)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	items, err := pgx.CollectRows(rows, func(row pgx.CollectableRow) (models.AdoptionRequest, error) { return scanAdoption(row) })
	if err != nil || tx.Commit(ctx) != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"data": items, "page": page, "limit": limit, "total": total})
}

func (h *AdoptionRequestsHandler) Review(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		writeError(w, http.StatusBadRequest, "invalid request id")
		return
	}
	var input struct {
		Status string `json:"status"`
	}
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.Status != "approved" && input.Status != "rejected" {
		writeError(w, http.StatusBadRequest, "status must be approved or rejected")
		return
	}

	ctx := r.Context()
	tx, err := h.DB.Begin(ctx)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	defer tx.Rollback(ctx)

	// Lock the shared dog before updating any request rows for it.
	var dogID int64
	var dogStatus string
	err = tx.QueryRow(ctx, `SELECT d.id, d.status FROM dogs d JOIN adoption_requests a ON a.dog_id = d.id
  WHERE a.id = $1 FOR UPDATE OF d`, id).Scan(&dogID, &dogStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "request not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	item, err := scanAdoption(tx.QueryRow(ctx, `WITH reviewed AS (
  UPDATE adoption_requests SET status = $2, updated_at = now()
  WHERE id = $1 AND status = 'pending' RETURNING *
 ) SELECT `+adoptionColumns+` FROM reviewed a`+adoptionJoins, id, input.Status))
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusConflict, "request is no longer pending")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	if input.Status == "approved" {
		if dogStatus != "available" {
			writeError(w, http.StatusConflict, "dog is not available")
			return
		}
		if _, err := tx.Exec(ctx, "UPDATE dogs SET status = 'adopted' WHERE id = $1", dogID); err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		if _, err := tx.Exec(ctx, `UPDATE adoption_requests SET status = 'rejected', updated_at = now()
   WHERE dog_id = $1 AND status = 'pending' AND id <> $2`, dogID, id); err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
	}
	if err := tx.Commit(ctx); err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusOK, item)
}
