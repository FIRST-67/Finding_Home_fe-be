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
  - Env: `DATABASE_URL`, `DOG_API_KEY`, `JWT_SECRET`, `ALLOWED_ORIGIN` (URL ของ Vercel), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- **Vercel (React)**: Root Directory `frontend` • Env: `VITE_API_URL` (URL ของ Render), `VITE_USE_MOCK=false`
- **Supabase**: Settings → Database → Connection string (แนะนำใช้ Session pooler)

## อัปโหลดรูปสุนัข

1. ใน Supabase Storage สร้าง bucket `dog-images` แบบ Public เพื่อให้หน้าเว็บอ่านรูปจาก URL ได้
2. ตั้งขนาดไฟล์สูงสุด 2 MB และอนุญาต MIME types `image/jpeg`, `image/png`, `image/webp`
3. ไม่เพิ่ม policy ที่ให้ `anon` หรือ `authenticated` เขียน ลบ หรือแทนที่รูปใน bucket นี้ ตรวจ policy ที่มีอยู่แล้วด้วย
4. ตั้ง `SUPABASE_URL` เป็น Project URL ของ Supabase และเก็บ `SUPABASE_SERVICE_ROLE_KEY` ใน Environment ของ Render เท่านั้น
5. หลังได้รับอนุมัติให้ deploy Backend ก่อน แล้ว deploy Frontend โดยใช้ URL ของ Backend และปิดโหมด mock ผู้ทดสอบที่มีเซสชัน mock เดิมต้องเข้าสู่ระบบใหม่ด้วยบัญชีจาก Backend

`POST /api/uploads/dogs` ใช้ Bearer JWT ของ Admin และรับ `multipart/form-data` ที่มีไฟล์หนึ่งไฟล์ในฟิลด์ `file` รองรับรูป JPG, PNG และ WEBP แบบภาพนิ่ง ขนาดสูงสุด 2 MiB และ 16 ล้านพิกเซล เมื่อสำเร็จจะคืน `201` พร้อม `{"image_url":"https://..."}` จากนั้นหน้า Admin ส่ง URL นี้ใน JSON ของ `POST /api/dogs` หรือ `PUT /api/dogs/{id}` ตามเดิม

## กติกา Git
- `main` = โค้ดที่ deploy ได้เสมอ ห้าม push ตรง
- แตก branch: `feature/<ชื่อ>-<งาน>` แล้วเปิด Pull Request
