# Finding Home — Frontend

Create React App + Tailwind CSS frontend for browsing dogs looking for a home, adoption requests, and admin dog management.

## Run locally

```bash
npm install
cp .env.example .env
npm start
```

With `REACT_APP_API_URL` empty, the development server proxies API requests to `https://finding-home-dfe0.onrender.com`. Set `REACT_APP_USE_MOCK=true` to run with local sample data.

For a local Go API, set `REACT_APP_API_URL=http://localhost:8080`. The example sets `PORT=5173` to preserve the existing local backend CORS configuration. The backend must allow both `http://127.0.0.1:5173` and `http://localhost:5173` in CORS for local browser requests.

Run checks with `npm test` and create a production build with `npm run build`.

## Data flow

Pages call domain services such as `services/dogs.js` or `services/auth.js`. Those services use `services/api.js`, which adds the saved Bearer token and sends JSON or multipart data with Fetch. In live mode the Go API handles the request and reads/writes Supabase; mock mode uses the in-memory sample services instead.

## Deploy to Vercel

Import the repository and set the Vercel project **Root Directory** to `frontend`. Use the Create React App framework preset. The build command is `npm run build` and the output directory is `build`. The default `REACT_APP_API_URL` uses the deployed API; override it in Vercel if needed, and set `REACT_APP_USE_MOCK=false` to use live dog data. `vercel.json` rewrites client-side routes to `index.html`.

The API must allow the local frontend origin and the deployed frontend origin in CORS. Confirm auth, favorites, and adoption-request routes match the frontend contract before enabling them outside mock mode.
