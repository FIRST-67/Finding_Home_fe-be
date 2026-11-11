package handlers

import (
	"errors"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"

	"finding-home/internal/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DogsHandler struct {
	DB *pgxpool.Pool
}

func NewDogsHandler(db *pgxpool.Pool) *DogsHandler {
	return &DogsHandler{DB: db}
}

type dogInput struct {
	Name        string  `json:"name"`
	BreedID     *int    `json:"breed_id"`
	BreedName   string  `json:"breed_name"`
	AgeYears    float64 `json:"age_years"`
	Gender      string  `json:"gender"`
	Description string  `json:"description"`
	ImageURL    string  `json:"image_url"`
}

type dogUpdateInput struct {
	dogInput
	Status *string `json:"status"`
}

const dogColumns = `
	id, name, breed_id, breed_name, age_years,
	gender, description, image_url, status, created_at
`

func scanDog(row pgx.Row) (models.Dog, error) {
	var dog models.Dog
	err := row.Scan(
		&dog.ID,
		&dog.Name,
		&dog.BreedID,
		&dog.BreedName,
		&dog.AgeYears,
		&dog.Gender,
		&dog.Description,
		&dog.ImageURL,
		&dog.Status,
		&dog.CreatedAt,
	)
	dog.CreatedAt = dog.CreatedAt.UTC()
	return dog, err
}

func validateDog(input dogInput) string {
	if strings.TrimSpace(input.Name) == "" {
		return "name is required"
	}
	if len([]rune(input.Name)) > 100 {
		return "name is too long"
	}
	if input.Gender != "male" && input.Gender != "female" {
		return "gender must be male or female"
	}
	if input.AgeYears < 0 || input.AgeYears > 999.9 {
		return "age_years must be between 0 and 999.9"
	}
	if input.BreedID != nil && (*input.BreedID < 1 || *input.BreedID > math.MaxInt32) {
		return "breed_id must be a positive 32-bit integer"
	}
	if len([]rune(input.BreedName)) > 100 {
		return "breed_name is too long"
	}
	return ""
}

func dogID(r *http.Request) (int64, error) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		return 0, errors.New("invalid dog id")
	}
	return id, nil
}

func positiveQuery(raw string, fallback, maximum int) (int, error) {
	if raw == "" {
		return fallback, nil
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n < 1 || n > maximum {
		return 0, errors.New("invalid pagination value")
	}
	return n, nil
}

// GET /api/dogs
func (h *DogsHandler) List(w http.ResponseWriter, r *http.Request) {
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
	if status == "" {
		status = "available"
	}
	if status != "available" && status != "adopted" {
		writeError(w, http.StatusBadRequest, "invalid status")
		return
	}

	gender := query.Get("gender")
	if gender != "" && gender != "male" && gender != "female" {
		writeError(w, http.StatusBadRequest, "invalid gender")
		return
	}

	conditions := []string{"status = $1"}
	args := []any{status}

	if q := strings.TrimSpace(query.Get("q")); q != "" {
		args = append(args, "%"+q+"%")
		conditions = append(
			conditions,
			fmt.Sprintf("name ILIKE $%d", len(args)),
		)
	}

	if raw := query.Get("breed_id"); raw != "" {
		breedID, err := strconv.Atoi(raw)
		if err != nil || breedID < 1 || breedID > math.MaxInt32 {
			writeError(w, http.StatusBadRequest, "invalid breed_id")
			return
		}
		args = append(args, breedID)
		conditions = append(
			conditions,
			fmt.Sprintf("breed_id = $%d", len(args)),
		)
	}

	if gender != "" {
		args = append(args, gender)
		conditions = append(
			conditions,
			fmt.Sprintf("gender = $%d", len(args)),
		)
	}

	where := " WHERE " + strings.Join(conditions, " AND ")

	var total int64
	err = h.DB.QueryRow(
		r.Context(),
		"SELECT COUNT(*) FROM dogs"+where,
		args...,
	).Scan(&total)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}

	offset := (page - 1) * limit
	listArgs := append([]any{}, args...)
	listArgs = append(listArgs, limit, offset)

	sql := fmt.Sprintf(
		`SELECT %s FROM dogs %s
		 ORDER BY created_at DESC, id DESC
		 LIMIT $%d OFFSET $%d`,
		dogColumns,
		where,
		len(listArgs)-1,
		len(listArgs),
	)

	rows, err := h.DB.Query(r.Context(), sql, listArgs...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	defer rows.Close()

	dogs := make([]models.Dog, 0)
	for rows.Next() {
		dog, err := scanDog(rows)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "database error")
			return
		}
		dogs = append(dogs, dog)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"data":  dogs,
		"page":  page,
		"limit": limit,
		"total": total,
	})
}

// GET /api/dogs/{id}
func (h *DogsHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := dogID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid dog id")
		return
	}

	dog, err := scanDog(h.DB.QueryRow(
		r.Context(),
		"SELECT "+dogColumns+" FROM dogs WHERE id = $1",
		id,
	))
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "dog not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusOK, dog)
}

// POST /api/dogs
func (h *DogsHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input dogInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if message := validateDog(input); message != "" {
		writeError(w, http.StatusBadRequest, message)
		return
	}

	sql := `
		INSERT INTO dogs (
			name, breed_id, breed_name, age_years,
			gender, description, image_url
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING ` + dogColumns

	dog, err := scanDog(h.DB.QueryRow(
		r.Context(),
		sql,
		strings.TrimSpace(input.Name),
		input.BreedID,
		input.BreedName,
		input.AgeYears,
		input.Gender,
		input.Description,
		input.ImageURL,
	))
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusCreated, dog)
}

// PUT /api/dogs/{id}
func (h *DogsHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := dogID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid dog id")
		return
	}

	var input dogUpdateInput
	if err := decodeJSON(r, &input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if message := validateDog(input.dogInput); message != "" {
		writeError(w, http.StatusBadRequest, message)
		return
	}
	if input.Status != nil && *input.Status != "available" && *input.Status != "adopted" {
		writeError(w, http.StatusBadRequest, "invalid status")
		return
	}

	sql := `
		UPDATE dogs SET
			name = $1,
			breed_id = $2,
			breed_name = $3,
			age_years = $4,
			gender = $5,
			description = $6,
			image_url = $7,
			status = COALESCE($8, status)
		WHERE id = $9
		RETURNING ` + dogColumns

	dog, err := scanDog(h.DB.QueryRow(
		r.Context(),
		sql,
		strings.TrimSpace(input.Name),
		input.BreedID,
		input.BreedName,
		input.AgeYears,
		input.Gender,
		input.Description,
		input.ImageURL,
		input.Status,
		id,
	))
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "dog not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	writeJSON(w, http.StatusOK, dog)
}

// DELETE /api/dogs/{id}
func (h *DogsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := dogID(r)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid dog id")
		return
	}

	tag, err := h.DB.Exec(
		r.Context(),
		"DELETE FROM dogs WHERE id = $1",
		id,
	)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "dog not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
