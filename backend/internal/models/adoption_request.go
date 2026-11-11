package models

import "time"

type AdoptionRequest struct {
	ID          int64     `json:"id"`
	DogID       int64     `json:"dog_id"`
	DogName     string    `json:"dog_name"`
	DogImageURL string    `json:"dog_image_url"`
	UserID      int64     `json:"user_id"`
	UserName    string    `json:"user_name"`
	Message     string    `json:"message"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
