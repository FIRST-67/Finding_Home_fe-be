# Finding Home — Frontend

React + Vite frontend for browsing dogs looking for a home, adoption requests, and admin dog management.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Set `VITE_API_URL` to the Go API origin. Set `VITE_USE_MOCK=true` to run with local sample data while the backend endpoints are being developed; set it to `false` to use the API. Mock accounts use `member@example.com` or `admin@example.com` with password `password123`.

At this point the Go API only provides health/database checks and dog-breed proxy routes; the auth, dog, favorite, adoption-request, and image routes used by this frontend still need to be implemented and CORS configured before using live mode.

Run checks with `npm test` and create a production build with `npm run build`.

## Data flow

Pages call domain services such as `services/dogs.js` or `services/auth.js`. Those services use `services/api.js`, which adds the saved Bearer token and sends JSON or multipart data with Fetch. In live mode the Go API handles the request and reads/writes Supabase; mock mode uses the in-memory sample services instead.

## Deploy to Vercel

Import the repository and set the Vercel project **Root Directory** to `frontend`. The Vite build command and output directory are `npm run build` and `dist`. Configure `VITE_API_URL` and `VITE_USE_MOCK=false` in the Vercel project environment variables, then redeploy. `vercel.json` rewrites client-side routes to `index.html`.

The Go API must allow the local Vite origin and the deployed Vercel origin in CORS. Confirm its auth, dog, favorites, adoption-request, and multipart image endpoints match the frontend contract before disabling mock mode.
