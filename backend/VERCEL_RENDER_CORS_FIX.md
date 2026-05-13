# Vercel + Render CORS Fix

This backend now allows:

- The exact URL in `FRONTEND_URL`
- Extra comma-separated URLs in `CORS_ORIGINS`
- Local development URLs
- Vercel preview/production URLs ending with `.vercel.app` when `ALLOW_VERCEL_PREVIEWS=true`

## Render environment variables

Set these in Render > Backend Service > Environment:

```env
NODE_ENV=production
NODE_VERSION=22
DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_long_random_secret
JWT_EXPIRY=7d
FRONTEND_URL=https://your-vercel-production-url.vercel.app
CORS_ORIGINS=https://your-vercel-production-url.vercel.app
ALLOW_VERCEL_PREVIEWS=true
AUTO_CREATE_ADMIN=true
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=password123
RUN_MIGRATIONS_ON_START=false
```

After saving environment variables, redeploy the Render service.

## Test URLs

Backend health:

```text
https://your-render-service.onrender.com/api/health
```

CORS check from a browser/frontend:

```text
https://your-render-service.onrender.com/api/cors-check
```
