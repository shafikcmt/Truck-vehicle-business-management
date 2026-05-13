# Project Setup Guide

## Quick Start

### 1. Database Setup (PostgreSQL)

**Windows:**
```bash
# Install PostgreSQL from https://www.postgresql.org/download/windows/

# After installation, open PostgreSQL command prompt or pgAdmin
# Create the database:
createdb truck_business

# Connect to the database
psql -U postgres -d truck_business

# Import schema and business-ready expansion
\i "path/to/migrations/001_initial_schema.sql"
\i "path/to/migrations/002_business_ready_features.sql"
# Or:
psql -U postgres -d truck_business -f "migrations/001_initial_schema.sql"
psql -U postgres -d truck_business -f "migrations/002_business_ready_features.sql"
```

**Linux/Mac:**
```bash
# Create database
createdb truck_business

# Run migrations
psql truck_business < migrations/001_initial_schema.sql
psql truck_business < migrations/002_business_ready_features.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Update .env with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=truck_business
# DB_USER=postgres
# DB_PASSWORD=your_password

# Install dependencies
npm install

# Start backend server
npm run dev
```

Backend will be available at: `http://localhost:5000`

Test API: `http://localhost:5000/api/health`

### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.example .env.local

# Install dependencies
npm install

# Start frontend server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 4. First-Time Login

1. Start PostgreSQL.
2. Start backend from the `backend` folder with `npm run dev`.
3. Start frontend from the `frontend` folder with `npm run dev`.
4. Go to `http://localhost:3000/login`.
5. Login with the development admin:
   - Email: `admin@example.com`
   - Password: `password123`

You can also register a new admin from the login page. Change the default password before production use.

## Database Credentials

Update `.env` in backend with your PostgreSQL credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=truck_business
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=change_this_to_a_strong_secret_key
```

## Project Structure

### Backend API Routes

```
├── /api/auth              # Authentication
├── /api/users             # Role-based users
├── /api/vehicles          # Vehicle management
├── /api/drivers           # Driver management
├── /api/trips             # Trip management
├── /api/income            # Income tracking
├── /api/expenses          # Expense tracking
├── /api/payments          # Payment & due management
├── /api/owners            # Owner/partner accounts
├── /api/reports           # Reports and exports
├── /api/billing           # Invoice and challan print pages
├── /api/system            # Settings and backup
└── /api/dashboard         # Dashboard metrics
```

### Frontend Pages

```
├── /login                 # Login/register page
├── /dashboard             # Dashboard
├── /vehicles              # Vehicle management
├── /drivers               # Driver management
├── /trips                 # Trip management
├── /income                # Income tracking
├── /expenses              # Expense tracking
├── /payments              # Payments and dues
├── /owners                # Owner/partner accounts
├── /reports               # Reports and export
├── /users                 # Role-based users
└── /settings              # Settings and backup
```

## Environment Variables

### Backend (.env)

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=truck_business
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRY=7d

# App URLs
APP_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Kill process on port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :5000
kill -9 <PID>
```

**Database connection error:**
- Verify PostgreSQL is running
- Check DB credentials in .env
- Ensure database exists: `psql -l`

### Frontend Issues

**npm install fails:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Next.js says it detected multiple lockfiles:**

The project now pins Turbopack root to the `frontend` folder in `frontend/next.config.js`. You can also delete unrelated lockfiles such as `C:\Users\sofik\package-lock.json` if you do not need them.

**Login page shows “Network Error” or “Backend API is not reachable”:**

This means the frontend is running, but it cannot reach the backend API. Keep two terminals open:

Terminal 1 - backend:
```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Terminal 2 - frontend:
```bash
cd frontend
copy .env.local.example .env.local
npm install
npm run dev
```

Then open `http://localhost:5000/api/health` in your browser. It should return JSON like `{ "status": "OK" }`. If it does not open, check PostgreSQL, database credentials, and migrations.

**API connection errors:**
- Check backend is running on port 5000
- Verify `NEXT_PUBLIC_API_URL=http://localhost:5000/api` in `frontend/.env.local`
- Check `FRONTEND_URL=http://localhost:3000` in `backend/.env`
- Check CORS settings in backend

## Development Tips

### Hot Reload
Both frontend and backend support hot reloading:
- Backend: nodemon automatically restarts on file changes
- Frontend: Next.js dev server automatically rebuilds

### Browser DevTools
Open browser DevTools (F12) to check:
- Network tab: API calls
- Console: JavaScript errors
- Application: Local storage, cookies

### API Testing
Use Postman or similar tool to test APIs:
1. Register: `POST http://localhost:5000/api/auth/register`
2. Login: `POST http://localhost:5000/api/auth/login`
3. Copy token from response
4. Add `Authorization: Bearer <token>` header to subsequent requests

## Performance Tips

### Backend
- Use pagination for large datasets
- Add database indexes (already included in schema)
- Cache frequently accessed data

### Frontend
- Use React.memo for component optimization
- Implement code splitting with dynamic imports
- Optimize images and assets
- Use service workers for offline support (Phase 2)

## Security Notes

- Change JWT_SECRET in production
- Use HTTPS in production
- Set secure CORS origins
- Never commit .env files
- Use environment variables for sensitive data
- Implement rate limiting (Phase 2)
- Add CSRF protection (Phase 2)

## Verification Checklist

1. Run both migrations.
2. Register the first admin from `/login`.
3. Add an owner, vehicle and driver.
4. Create a trip and record expenses/payments.
5. Check due status from `/payments`.
6. Generate reports from `/reports`.
7. Print invoice/challan from `/trips`.
8. Download backup from `/settings`.

## Notes

- PDF export uses printable HTML pages. Choose Print, then Save as PDF in the browser.
- Excel export uses CSV format.
- If `frontend/node_modules` came from another OS, delete it and run `npm install` before `npm run dev` or `npm run build`.

## Support

For detailed API documentation, check the README.md file.
For issues, check the project logs in:
- Backend: Console output
- Frontend: Browser console

## Database Backup

```bash
# Backup database
pg_dump truck_business > backup.sql

# Restore database
psql truck_business < backup.sql
```

---

Happy coding! 🚚

## Tailwind/PostCSS note

This project uses Tailwind CSS v4. If you see an error like `trying to use tailwindcss directly as a PostCSS plugin`, reinstall frontend dependencies after pulling this update:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

The frontend PostCSS config must use `@tailwindcss/postcss`, not `tailwindcss`, as the PostCSS plugin.


## Fix: password authentication failed for user "postgres"

This is a PostgreSQL password/config issue, not a frontend issue.

### Existing PostgreSQL

Edit `backend/.env` and set:

```env
DB_PASSWORD=your_real_postgres_password
```

Then run:

```bash
cd backend
npm run migrate
npm run seed:admin
npm run dev
```

### Docker PostgreSQL

From project root:

```bash
docker compose up -d postgres
cd backend
copy .env.example .env
npm install
npm run migrate
npm run seed:admin
npm run dev
```

The Docker database uses:

```env
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=truck_business
```
