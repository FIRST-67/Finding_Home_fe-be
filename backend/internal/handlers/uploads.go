package handlers

import (
	"bytes"
	"crypto/rand"
	"errors"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"log"
	"mime"
	"net/http"
	"net/url"
	"strings"
	"time"

	_ "golang.org/x/image/webp"
)

const (
	maxDogImageBytes  = 2 << 20
	maxDogImagePixels = 16_000_000
	dogImagesBucket   = "dog-images"
)

type dogImageUploads struct {
	storageURL string
	serviceKey string
	client     *http.Client
	active     chan struct{}
}

func NewDogImageUpload(supabaseURL, serviceKey string) http.HandlerFunc {
	uploads := &dogImageUploads{
		serviceKey: strings.TrimSpace(serviceKey),
		client: &http.Client{
			Timeout: 15 * time.Second,
			CheckRedirect: func(*http.Request, []*http.Request) error {
				return http.ErrUseLastResponse
			},
		},
		active: make(chan struct{}, 2),
	}
	origin, err := url.Parse(strings.TrimSpace(supabaseURL))
	if err == nil && origin.Scheme == "https" && origin.Host != "" && origin.User == nil &&
		(origin.Path == "" || origin.Path == "/") && origin.RawQuery == "" && origin.Fragment == "" {
		uploads.storageURL = origin.Scheme + "://" + origin.Host + "/storage/v1/object"
	}
	return uploads.upload
}

func (h *dogImageUploads) upload(w http.ResponseWriter, r *http.Request) {
	if h.storageURL == "" || h.serviceKey == "" {
		writeError(w, http.StatusServiceUnavailable, "image storage is not configured")
		return
	}

	requestType, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
	if err != nil || requestType != "multipart/form-data" {
		writeError(w, http.StatusBadRequest, "expected multipart/form-data with a file field")
		return
	}

	select {
	case h.active <- struct{}{}:
		defer func() { <-h.active }()
	default:
		w.Header().Set("Retry-After", "1")
		writeError(w, http.StatusTooManyRequests, "too many uploads in progress")
		return
	}

	// Bound how long a client can hold an upload slot while sending the body.
	controller := http.NewResponseController(w)
	if controller.SetReadDeadline(time.Now().Add(15*time.Second)) == nil {
		defer controller.SetReadDeadline(time.Time{})
	}

	// Allow a small amount of multipart overhead beyond the file limit.
	r.Body = http.MaxBytesReader(w, r.Body, maxDogImageBytes+(64<<10))
	defer r.Body.Close()
	reader, err := r.MultipartReader()
	if err != nil {
		writeError(w, http.StatusBadRequest, "expected multipart/form-data with a file field")
		return
	}
	part, err := reader.NextPart()
	if err != nil {
		writeMultipartError(w, err)
		return
	}
	if part.FormName() != "file" || part.FileName() == "" {
		writeError(w, http.StatusBadRequest, "expected a file in the file field")
		return
	}
	data, err := io.ReadAll(io.LimitReader(part, maxDogImageBytes+1))
	if err != nil {
		writeMultipartError(w, err)
		return
	}
	if len(data) > maxDogImageBytes {
		writeError(w, http.StatusRequestEntityTooLarge, "image exceeds 2 MB")
		return
	}
	if _, err := reader.NextPart(); err != io.EOF {
		writeMultipartError(w, err)
		return
	}

	contentType := http.DetectContentType(data)
	declaredHeader := part.Header.Get("Content-Type")
	declaredType, _, declaredErr := mime.ParseMediaType(declaredHeader)
	format, extension := "", ""
	switch contentType {
	case "image/jpeg":
		format, extension = "jpeg", ".jpg"
	case "image/png":
		format, extension = "png", ".png"
	case "image/webp":
		format, extension = "webp", ".webp"
	}
	if format == "" || (declaredHeader != "" &&
		(declaredErr != nil || (declaredType != "application/octet-stream" && declaredType != contentType))) {
		writeError(w, http.StatusUnsupportedMediaType, "expected a JPG, PNG or WEBP image")
		return
	}
	dimensions, detectedFormat, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || detectedFormat != format || dimensions.Width < 1 || dimensions.Height < 1 {
		writeError(w, http.StatusUnsupportedMediaType, "invalid image")
		return
	}
	if dimensions.Width > maxDogImagePixels/dimensions.Height {
		writeError(w, http.StatusRequestEntityTooLarge, "image exceeds 16 megapixels")
		return
	}
	if _, _, err := image.Decode(bytes.NewReader(data)); err != nil {
		writeError(w, http.StatusUnsupportedMediaType, "invalid image")
		return
	}

	object := dogImagesBucket + "/" + rand.Text() + extension
	request, err := http.NewRequestWithContext(r.Context(), http.MethodPost, h.storageURL+"/"+object, bytes.NewReader(data))
	if err != nil {
		writeError(w, http.StatusBadGateway, "image storage upload failed")
		return
	}
	request.Header.Set("Content-Type", contentType)
	request.Header.Set("Authorization", "Bearer "+h.serviceKey)
	request.Header.Set("apikey", h.serviceKey)
	request.Header.Set("x-upsert", "false")

	response, err := h.client.Do(request)
	if err != nil {
		log.Print("dog image storage request failed")
		writeError(w, http.StatusBadGateway, "image storage upload failed")
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		log.Printf("dog image storage returned status %d", response.StatusCode)
		writeError(w, http.StatusBadGateway, "image storage upload failed")
		return
	}
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 4096))

	writeJSON(w, http.StatusCreated, map[string]string{"image_url": h.storageURL + "/public/" + object})
}

func writeMultipartError(w http.ResponseWriter, err error) {
	var tooLarge *http.MaxBytesError
	if errors.As(err, &tooLarge) {
		writeError(w, http.StatusRequestEntityTooLarge, "image exceeds 2 MB")
		return
	}
	writeError(w, http.StatusBadRequest, "expected exactly one multipart file")
}
