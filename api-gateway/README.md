# Sentimind API Gateway

Single entry point for all frontend-to-backend traffic. Routes requests to the correct microservice.

## Routes

| Path | Target Service | Example |
|------|----------------|---------|
| `/auth/*` | Auth Service (8011) | Login, signup, refresh, logout, profile |
| `/projects/*` | Auth Service (8011) | List, create, get, update projects |
| `/api/collect/*` | Collector Service (8021) | Run collection, get summary |
| `/health` | Gateway | Health check |

## Setup

```bash
cp .env.example .env   # optional; defaults work for local dev
npm install
npm run dev
```

Runs on **http://localhost:8000** by default.

## Environment

- `PORT` – Gateway port (default 8000)
- `AUTH_SERVICE_URL` – Auth service base URL (default http://localhost:8011)
- `COLLECTOR_SERVICE_URL` – Collector service base URL (default http://localhost:8021)
- `CORS_ORIGIN` – Comma-separated frontend origins (default http://localhost:3000,http://localhost:3001)

## Frontend

Point the frontend to the gateway by setting (optional, gateway is default):

```env
VITE_API_GATEWAY_URL=http://localhost:8000
```

If unset, the frontend defaults to `http://localhost:8000` for all API calls.
