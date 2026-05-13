# Render timeout fix

The frontend API timeout was increased from 15 seconds to 120 seconds because Render free web services can cold start after inactivity.

Use this backend health URL before login if the first request is slow:

https://truck-vehicle-business-management.onrender.com/api/health

Vercel environment variable:

NEXT_PUBLIC_API_URL=https://truck-vehicle-business-management.onrender.com/api

After replacing the frontend, push:

```bash
git add .
git commit -m "Increase frontend API timeout for Render cold start"
git push origin master
```
