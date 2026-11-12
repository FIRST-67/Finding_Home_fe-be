# Finding Home — Frontend

React + Vite frontend for browsing dogs looking for a home, adoption requests, and admin dog management.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The local `.env.example` points directly to `https://finding-home-dfe0.onrender.com`. Dog listing and detail pages use its live `/api/dogs` endpoints. Set `VITE_USE_MOCK=true` to run with local sample data; auth, profile, favorites, and adoption-request endpoints remain mocked until their backend contract is confirmed.

For a local Go API, set `VITE_API_URL=http://localhost:8080`. The local Go API branch provides health/database checks and dog-breed proxy routes; dog listing/detail is available through the deployed API configured above. The backend must allow both `http://127.0.0.1:5173` and `http://localhost:5173` in CORS for local browser requests.

Run checks with `npm test` and create a production build with `npm run build`.

## Data flow

Pages call domain services such as `services/dogs.js` or `services/auth.js`. Those services use `services/api.js`, which adds the saved Bearer token and sends JSON or multipart data with Fetch. In live mode the Go API handles the request and reads/writes Supabase; mock mode uses the in-memory sample services instead.

## Deploy to Vercel

Import the repository and set the Vercel project **Root Directory** to `frontend`. The Vite build command and output directory are `npm run build` and `dist`. The default `VITE_API_URL` uses the deployed API; override it in Vercel if needed, and set `VITE_USE_MOCK=false` to use live dog data. `vercel.json` rewrites client-side routes to `index.html`.

The API must allow the local Vite origin and the deployed frontend origin in CORS. Confirm auth, favorites, and adoption-request routes match the frontend contract before enabling them outside mock mode.
