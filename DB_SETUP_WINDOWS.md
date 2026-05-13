# Database setup for Windows

The backend error `password authentication failed for user "postgres"` means the app reached PostgreSQL, but the password in `backend/.env` does not match your local PostgreSQL password.

## Option A: Use your existing PostgreSQL installation

1. Open `backend/.env`.
2. Update this line with your real PostgreSQL password:

```env
DB_PASSWORD=your_real_postgres_password
```

3. Make sure these values match your local PostgreSQL setup:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=truck_business
DB_USER=postgres
```

4. Create the database once if it does not exist:

```bash
createdb -U postgres truck_business
```

If `createdb` asks for a password, enter your actual PostgreSQL password.

5. Run backend:

```bash
cd backend
npm install
npm run migrate
npm run seed:admin
npm run dev
```

## Option B: Use Docker PostgreSQL with the included password

This project includes a Docker PostgreSQL service where the password is exactly `password`, matching `backend/.env.example`.

From the project root:

```bash
docker compose up -d postgres
```

Then run:

```bash
cd backend
copy .env.example .env
npm install
npm run migrate
npm run seed:admin
npm run dev
```

## Backend health check

Open this in your browser:

```text
http://localhost:5000/api/health
```

Expected result:

```json
{"status":"OK"}
```

## Login

```text
Email: admin@example.com
Password: password123
```

Change this password after first login.
