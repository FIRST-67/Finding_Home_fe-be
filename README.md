# Finding Home – ระบบรับเลี้ยงสัตว์เลี้ยง

React + Fetch API • Go • Supabase (PostgreSQL) • TheDogAPI

## โครงสร้าง
```
frontend/   React (Vite) → deploy Vercel
backend/    Go (net/http + pgx) → deploy Render
```

## เริ่มใช้งาน (ทำครั้งเดียวหลัง clone)

### Backend
```bash
cd backend
cp .env.example .env      # ใส่ DATABASE_URL (Supabase) และ DOG_API_KEY
go mod tidy
go run ./cmd/server       # http://localhost:8080
```
ทดสอบ: `GET /api/health`, `GET /api/db-check`, `GET /api/breeds`

### Frontend
```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:8080
npm install
npm run dev               # http://localhost:5173
npm test                  # รัน unit test
```

## Deploy
- **Render (Go)**: Root Directory `backend` • Build `go build -o app ./cmd/server` • Start `./app`
  - Env: `DATABASE_URL`, `DOG_API_KEY`, `ALLOWED_ORIGIN` (URL ของ Vercel)
- **Vercel (React)**: Root Directory `frontend` • Env: `VITE_API_URL` (URL ของ Render)
- **Supabase**: Settings → Database → Connection string (แนะนำใช้ Session pooler)

## กติกา Git
- `main` = โค้ดที่ deploy ได้เสมอ ห้าม push ตรง
- แตก branch: `feature/<ชื่อ>-<งาน>` แล้วเปิด Pull Request
