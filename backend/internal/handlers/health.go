package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

// DBCheck ใช้ยืนยันว่า FE → Go → Database ต่อกันได้จริง
func DBCheck(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		var now time.Time
		if err := pool.QueryRow(ctx, "SELECT now()").Scan(&now); err != nil {
			writeError(w, http.StatusServiceUnavailable, "database unreachable")
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"database": "connected", "time": now})
	}
}
