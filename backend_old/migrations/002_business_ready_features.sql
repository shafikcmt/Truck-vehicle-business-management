-- Business-ready feature expansion for Truck & Vehicle Business Management System
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30);

CREATE TABLE IF NOT EXISTS owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(30),
  address TEXT,
  commission_percentage NUMERIC(5, 2) DEFAULT 0,
  profit_share_percentage NUMERIC(5, 2) DEFAULT 0,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES owners(id) ON DELETE SET NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity VARCHAR(100);

ALTER TABLE trips ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS goods_description TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_no VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS note TEXT;

CREATE TABLE IF NOT EXISTS owner_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'Cash',
  payment_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone_number VARCHAR(30),
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO app_settings (key, value) VALUES
  ('currency', 'BDT'),
  ('currency_symbol', 'BDT'),
  ('default_language', 'en'),
  ('business_name', 'Truck & Vehicle Business Management System')
ON CONFLICT (key) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_payments_owner ON owner_payments(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_payments_date ON owner_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_trips_customer ON trips(customer_name);
CREATE INDEX IF NOT EXISTS idx_trips_branch ON trips(branch_name);
