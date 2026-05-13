# Frontend API Fetch Fix

This frontend removes Axios from runtime API calls and uses native browser `fetch` with:

- API URL normalization
- 120 second timeout for Render free cold starts
- `/api/health` connection test button on login page
- clearer browser/network/CORS error messages
- safer token handling after login

Vercel environment variable:

```env
NEXT_PUBLIC_API_URL=https://truck-vehicle-business-management.onrender.com/api
```

After pushing to GitHub, redeploy Vercel with cleared build cache.
