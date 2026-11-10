package db

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connect เปิด connection pool ไปยัง Supabase (PostgreSQL)
func Connect(ctx context.Context, url string) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, url)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return pool, nil
}
