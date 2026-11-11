package models

import "time"

type Dog struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	BreedID     *int      `json:"breed_id"`
	BreedName   string    `json:"breed_name"`
	AgeYears    float64   `json:"age_years"`
	Gender      string    `json:"gender"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
}
