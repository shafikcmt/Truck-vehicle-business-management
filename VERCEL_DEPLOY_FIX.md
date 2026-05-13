# Vercel 404 Fix for Truck Vehicle Business Management Frontend

This frontend is configured as a static Next.js export. It creates `frontend/out` during build.

## Vercel option A: Deploy from repo root

Use these settings in Vercel:

- Root Directory: empty / repository root
- Install Command: `cd frontend && npm install --legacy-peer-deps --no-audit --no-fund`
- Build Command: `cd frontend && npm run build`
- Output Directory: `frontend/out`

The included root `vercel.json` already contains these settings.

## Vercel option B: Deploy with Root Directory = frontend

Use these settings in Vercel:

- Root Directory: `frontend`
- Install Command: `npm install --legacy-peer-deps --no-audit --no-fund`
- Build Command: `npm run build`
- Output Directory: `out`

The included `frontend/vercel.json` already contains these settings.

## Required Vercel Environment Variable

Set this in Vercel before deploying:

```env
NEXT_PUBLIC_API_URL=https://truck-vehicle-business-management.onrender.com/api
```

After the frontend URL is live, update Render backend:

```env
FRONTEND_URL=https://YOUR-VERCEL-URL.vercel.app
```

Then redeploy the Render backend once.

## Test URLs

Backend health:

```text
https://truck-vehicle-business-management.onrender.com/api/health
```

Frontend:

```text
https://YOUR-VERCEL-URL.vercel.app/login
```

Demo login:

```text
Email: admin@example.com
Password: password123
```
