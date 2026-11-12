package handlers

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"net/textproto"
	"strings"
	"testing"
	"time"

	"finding-home/internal/middleware"
	"github.com/golang-jwt/jwt/v5"
)

func TestDogImageUploads(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	var jpg, pngFile bytes.Buffer
	if err := jpeg.Encode(&jpg, img, nil); err != nil {
		t.Fatal(err)
	}
	if err := png.Encode(&pngFile, img); err != nil {
		t.Fatal(err)
	}
	webp, err := base64.StdEncoding.DecodeString("UklGRj4AAABXRUJQVlA4IDIAAADQAQCdASoCAAIAAUAmJaACdLoB+AADsAD+8JCj/4cp8OU+HKf8OU/9QZ8tD5aH63AAAA==")
	if err != nil {
		t.Fatal(err)
	}

	type storedImage struct {
		path, contentType string
		data              []byte
	}
	stored := make(chan storedImage, 10)
	storage := httptest.NewTLSServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.Header.Get("apikey") != "storage-test-key" ||
			r.Header.Get("Authorization") != "Bearer storage-test-key" || r.Header.Get("x-upsert") != "false" {
			t.Error("unexpected storage request method or headers")
		}
		data, err := io.ReadAll(r.Body)
		if err != nil {
			t.Error(err)
		}
		stored <- storedImage{r.URL.Path, r.Header.Get("Content-Type"), data}
		w.WriteHeader(http.StatusOK)
	}))
	defer storage.Close()

	uploads := &dogImageUploads{
		storageURL: storage.URL + "/storage/v1/object",
		serviceKey: "storage-test-key",
		client:     storage.Client(),
		active:     make(chan struct{}, 2),
	}
	const origin = "https://finding-home-fe-be.vercel.app"
	secret := []byte("test-only-signing-secret-at-least-32-bytes")
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/uploads/dogs", middleware.RequireAuth(secret, middleware.RequireRole("admin", uploads.upload)))
	server := httptest.NewServer(middleware.CORS(origin, mux))
	defer server.Close()

	keys := make(map[string]bool)
	for _, tc := range []struct {
		name, role, contentType, extension string
		data                               []byte
		status                             int
	}{
		{"JPEG", "admin", "image/jpeg", ".jpg", jpg.Bytes(), 201},
		{"PNG", "admin", "image/png", ".png", pngFile.Bytes(), 201},
		{"WebP", "admin", "image/webp", ".webp", webp, 201},
		{"same original filename", "admin", "image/png", ".png", pngFile.Bytes(), 201},
		{"member", "member", "image/png", "", pngFile.Bytes(), 403},
		{"guest", "", "image/png", "", pngFile.Bytes(), 401},
		{"oversized", "admin", "image/png", "", make([]byte, maxDogImageBytes+1), 413},
		{"non-image", "admin", "image/png", "", []byte("plain text"), 415},
		{"mismatched MIME", "admin", "image/jpeg", "", pngFile.Bytes(), 415},
		{"truncated image", "admin", "image/png", "", pngFile.Bytes()[:len(pngFile.Bytes())-16], 415},
	} {
		t.Run(tc.name, func(t *testing.T) {
			var body bytes.Buffer
			form := multipart.NewWriter(&body)
			header := textproto.MIMEHeader{
				"Content-Disposition": {`form-data; name="file"; filename="../../same.png"`},
				"Content-Type":        {tc.contentType},
			}
			part, err := form.CreatePart(header)
			if err != nil {
				t.Fatal(err)
			}
			if _, err := part.Write(tc.data); err != nil {
				t.Fatal(err)
			}
			if err := form.Close(); err != nil {
				t.Fatal(err)
			}

			req, err := http.NewRequest(http.MethodPost, server.URL+"/api/uploads/dogs", &body)
			if err != nil {
				t.Fatal(err)
			}
			req.Header.Set("Origin", origin)
			req.Header.Set("Content-Type", form.FormDataContentType())
			if tc.role != "" {
				token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
					"user_id": 1, "role": tc.role, "exp": time.Now().Add(time.Minute).Unix(),
				}).SignedString(secret)
				if err != nil {
					t.Fatal(err)
				}
				req.Header.Set("Authorization", "Bearer "+token)
			}
			res, err := server.Client().Do(req)
			if err != nil {
				t.Fatal(err)
			}
			defer res.Body.Close()
			if res.StatusCode != tc.status || res.Header.Get("Access-Control-Allow-Origin") != origin {
				t.Fatalf("status = %d, CORS origin = %q", res.StatusCode, res.Header.Get("Access-Control-Allow-Origin"))
			}
			if tc.status != http.StatusCreated {
				if len(stored) != 0 {
					t.Fatal("rejected upload reached storage")
				}
				return
			}

			var result map[string]string
			if err := json.NewDecoder(res.Body).Decode(&result); err != nil {
				t.Fatal(err)
			}
			select {
			case saved := <-stored:
				key := strings.TrimPrefix(saved.path, "/storage/v1/object/dog-images/")
				if strings.Contains(key, "/") || strings.Contains(key, "same") || !strings.HasSuffix(key, tc.extension) {
					t.Fatalf("unexpected object key %q", key)
				}
				if keys[key] {
					t.Fatalf("object key reused: %q", key)
				}
				keys[key] = true
				expected := storage.URL + "/storage/v1/object/public/dog-images/" + key
				if result["image_url"] != expected || saved.contentType != tc.contentType || !bytes.Equal(saved.data, tc.data) {
					t.Fatal("stored image or returned URL differs from the upload")
				}
			default:
				t.Fatal("missing storage request")
			}
		})
	}

	req := httptest.NewRequest(http.MethodOptions, "/api/uploads/dogs", nil)
	req.Header.Set("Origin", origin)
	req.Header.Set("Access-Control-Request-Method", "POST")
	req.Header.Set("Access-Control-Request-Headers", "Authorization, Content-Type")
	recorder := httptest.NewRecorder()
	middleware.CORS(origin, mux).ServeHTTP(recorder, req)
	if recorder.Code != http.StatusNoContent || recorder.Header().Get("Access-Control-Allow-Origin") != origin ||
		!strings.Contains(recorder.Header().Get("Access-Control-Allow-Headers"), "Authorization") {
		t.Fatalf("unexpected preflight response: %d %v", recorder.Code, recorder.Header())
	}
}

func TestLegacyDogJSONRejectsOversizedInlineImage(t *testing.T) {
	body := `{"name":"Example","gender":"female","image_url":"data:image/jpeg;base64,` +
		strings.Repeat("a", 1<<20) + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/dogs", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	recorder := httptest.NewRecorder()
	NewDogsHandler(nil).Create(recorder, req)
	if recorder.Code != http.StatusBadRequest || !strings.Contains(recorder.Body.String(), "invalid JSON") {
		t.Fatalf("unexpected response: %d %s", recorder.Code, recorder.Body.String())
	}
}
