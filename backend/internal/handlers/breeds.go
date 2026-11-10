package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const dogAPIBase = "https://api.thedogapi.com/v1"

// Breed คือข้อมูลที่เราส่งต่อให้ Frontend (เลือกเฉพาะฟิลด์ที่ใช้)
type Breed struct {
	ID          json.Number `json:"id"`
	Name        string      `json:"name"`
	Temperament string      `json:"temperament"`
	LifeSpan    string      `json:"life_span"`
	Origin      string      `json:"origin"`
	BredFor     string      `json:"bred_for"`
	BreedGroup  string      `json:"breed_group"`
	WeightKg    string      `json:"weight_kg"`
	ImageURL    string      `json:"image_url"`
}

// รูปแบบที่ TheDogAPI ตอบกลับ
type dogAPIBreed struct {
	ID          json.Number `json:"id"`
	Name        string      `json:"name"`
	Temperament string      `json:"temperament"`
	LifeSpan    string      `json:"life_span"`
	Origin      string      `json:"origin"`
	BredFor     string      `json:"bred_for"`
	BreedGroup  string      `json:"breed_group"`
	Weight      struct {
		Metric string `json:"metric"`
	} `json:"weight"`
	Image struct {
		URL string `json:"url"`
	} `json:"image"`
	// /breeds/search ไม่ส่งรูปมาตรงๆ แต่ส่ง reference_image_id
	ReferenceImageID string `json:"reference_image_id"`
}

type BreedsHandler struct {
	APIKey string
	client *http.Client
}

func NewBreedsHandler(apiKey string) *BreedsHandler {
	return &BreedsHandler{APIKey: apiKey, client: &http.Client{Timeout: 10 * time.Second}}
}

// List: GET /api/breeds?limit=12&page=0
func (h *BreedsHandler) List(w http.ResponseWriter, r *http.Request) {
	limit := intParam(r, "limit", 12, 1, 50)
	page := intParam(r, "page", 0, 0, 1000)

	q := url.Values{}
	q.Set("limit", strconv.Itoa(limit))
	q.Set("page", strconv.Itoa(page))
	h.fetchAndRespond(w, "/breeds?"+q.Encode())
}

// Search: GET /api/breeds/search?q=husky
func (h *BreedsHandler) Search(w http.ResponseWriter, r *http.Request) {
	term := r.URL.Query().Get("q")
	if term == "" {
		writeError(w, http.StatusBadRequest, "q is required")
		return
	}
	q := url.Values{}
	q.Set("q", term)
	h.fetchAndRespond(w, "/breeds/search?"+q.Encode())
}

func (h *BreedsHandler) fetchAndRespond(w http.ResponseWriter, path string) {
	req, err := http.NewRequest(http.MethodGet, dogAPIBase+path, nil)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "cannot build request")
		return
	}
	if h.APIKey != "" {
		req.Header.Set("x-api-key", h.APIKey)
	}

	resp, err := h.client.Do(req)
	if err != nil {
		writeError(w, http.StatusBadGateway, "TheDogAPI unreachable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		writeError(w, http.StatusBadGateway, fmt.Sprintf("TheDogAPI returned %d", resp.StatusCode))
		return
	}

	var raw []dogAPIBreed
	if err := json.NewDecoder(resp.Body).Decode(&raw); err != nil {
		writeError(w, http.StatusBadGateway, "invalid response from TheDogAPI")
		return
	}

	breeds := make([]Breed, 0, len(raw))
	for _, b := range raw {
		img := b.Image.URL
		if img == "" && b.ReferenceImageID != "" {
			img = fmt.Sprintf("https://cdn2.thedogapi.com/images/%s.jpg", b.ReferenceImageID)
		}
		breeds = append(breeds, Breed{
			ID: b.ID, Name: b.Name, Temperament: b.Temperament,
			LifeSpan: b.LifeSpan, Origin: b.Origin, BredFor: b.BredFor,
			BreedGroup: b.BreedGroup, WeightKg: b.Weight.Metric, ImageURL: img,
		})
	}
	writeJSON(w, http.StatusOK, breeds)
}

func intParam(r *http.Request, key string, def, min, max int) int {
	v, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil || v < min {
		return def
	}
	if v > max {
		return max
	}
	return v
}
