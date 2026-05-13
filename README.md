# Truck & Vehicle Business Management System

A professional responsive web-based accounting and management system for truck/vehicle rental businesses in Bangladesh.

## Core Features

- Secure login and role-based users: admin, staff, viewer
- Dashboard with vehicle count, active trips, income, expenses, dues, profit/loss and charts
- Vehicle/truck management with owner, status, model, capacity and document expiry tracking
- Driver management with salary/commission information and trip history support
- Trip management with truck, driver, route, customer, fare, advance, due and status
- Income and expense management with trip-wise and vehicle-wise tracking
- Customer payment records, partial payments, due tracking and payment methods
- Owner/partner accounts with owner payments and profit/commission fields
- Profit/loss calculation and reports
- Daily, monthly, yearly, vehicle-wise, driver-wise, customer-wise, due, expense and owner reports
- CSV export for Excel-compatible reports
- Printable report, customer invoice and trip challan pages for browser Save as PDF
- Settings and JSON backup export
- Bengali/English locale foundation retained in `frontend/public/locales`
- Bangladeshi Taka formatting in the UI
- Mobile-friendly responsive UI with optional dark mode

## Technology Stack

### Backend
- Node.js / Express.js
- PostgreSQL
- JWT + bcrypt authentication
- REST API architecture

### Frontend
- Next.js / React
- Responsive CSS utility design
- Axios API client
- App Router pages

## Project Structure

```text
truck-business-system/
├── backend/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   └── 002_business_ready_features.sql
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── utils/
│   └── server.js
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/locales/
│   └── styles/
├── PROMPT_COMPARISON.md
├── PROGRESS.md
└── SETUP.md
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
createdb truck_business
psql truck_business < migrations/001_initial_schema.sql
psql truck_business < migrations/002_business_ready_features.sql
npm run dev
```

Backend runs on `http://localhost:5000`.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Frontend runs on `http://localhost:3000`.

## API Endpoint Groups

- `/api/auth` - register, login, current user, password change
- `/api/users` - admin user management
- `/api/dashboard` - dashboard summary and alerts
- `/api/vehicles` - vehicle/truck CRUD and search
- `/api/drivers` - driver CRUD and trip history
- `/api/trips` - trip CRUD, filters and status updates
- `/api/income` - income CRUD and filters
- `/api/expenses` - expense CRUD and filters
- `/api/payments` - payments, dues and due status
- `/api/owners` - owner/partner CRUD and owner payments
- `/api/reports` - business reports with JSON, CSV and print formats
- `/api/billing` - printable invoice and challan
- `/api/system` - settings and backup export

## Export Formats

Reports support these formats using the `format` query parameter:

```text
format=json   default API response
format=csv    Excel-compatible CSV
format=excel  alias for CSV
format=print  printable HTML for browser Save as PDF
format=pdf    alias for printable HTML
```

Example:

```text
/api/reports/profit-loss?startDate=2026-05-01&endDate=2026-05-31&format=csv
```

## Notes

- Run both migration files for a complete business-ready database.
- Printable HTML is used for PDF export to avoid extra server-side PDF dependencies.
- CSV export opens directly in Excel and Google Sheets.
- If the uploaded `node_modules` folder was produced on another OS, run `npm install` locally before running or building.


## Quick database fix for Windows

If backend shows `password authentication failed for user "postgres"`, your `backend/.env` database password does not match your PostgreSQL password. Read `DB_SETUP_WINDOWS.md`.

Fast Docker option from project root:

```bash
docker compose up -d postgres
cd backend
copy .env.example .env
npm install
npm run migrate
npm run seed:admin
npm run dev
```

Then open `http://localhost:5000/api/health` and login with `admin@example.com` / `password123`.
