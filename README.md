# Disaster Frontend

React + Vite frontend for the disaster response platform.

The frontend talks to the backend through `VITE_API_BASE_URL` and uses the `/api/events` contract. It should not call the legacy `/api/disasters` endpoint directly.

## Requirements

- Node.js 18 or newer
- npm
- Running disaster backend

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm run dev
```

## Environment

```text
VITE_API_BASE_URL=http://localhost:3000/api
VITE_ENABLE_MOCK_FALLBACK=true
VITE_KAKAO_APP_KEY=
```

Use `.env.example` for safe placeholders only. Do not commit `.env` or `.env.local`.

`VITE_KAKAO_APP_KEY` is the Kakao Developers JavaScript key used by the event detail KakaoTalk share button. Register local and deployed web domains such as `http://localhost:5173` and `https://reliefkoreafe.vercel.app` in the Kakao app settings.

When `VITE_ENABLE_MOCK_FALLBACK` is not `false`, the frontend falls back to local mock events, reports, organizations, and donation history if the backend API is unavailable. These mock records live only in `src/data/mockData.ts`; they are never written to the backend database.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Backend Connection

Start the backend first, then run the frontend. The default frontend API base URL is:

```text
http://localhost:3000/api
```

The frontend expects these backend endpoints:

- `GET /api/events`
- `GET /api/events/:eventId`
- `GET /api/events/:eventId/articles`
- `GET /api/events/:eventId/updates`
- `GET /api/events/:eventId/orgs`
- `GET /api/orgs/:orgId`
- `GET /api/orgs/:orgId/history`

## Troubleshooting

### `ERR_CONNECTION_REFUSED`

The backend is probably not running. Start the backend and confirm:

```text
http://localhost:3000/api/health
```

### Wrong Backend URL

Check `.env`:

```text
VITE_API_BASE_URL=http://localhost:3000/api
```

Restart the Vite dev server after changing `.env`.

### Stale Data In Development

Hard refresh once and confirm the service worker is not caching development API responses.
