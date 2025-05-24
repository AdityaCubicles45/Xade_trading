-- Drop existing tables if they exist
DROP TABLE IF EXISTS active_positions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with correct schema
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  email text,
  username text NOT NULL,
  tier text NOT NULL DEFAULT 'basic',
  stage text NOT NULL DEFAULT 'demo',
  current_balance float NOT NULL DEFAULT 10000,
  current_pnl float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  market text NOT NULL,
  position_type text NOT NULL CHECK (position_type IN ('Buy', 'Sell')),
  amount float NOT NULL,
  entry_price float NOT NULL,
  order_type text NOT NULL DEFAULT 'market' CHECK (order_type IN ('market', 'limit')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create active_positions table
CREATE TABLE active_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  market text NOT NULL,
  amount float NOT NULL,
  entry_price float NOT NULL,
  current_price float NOT NULL,
  pnl float NOT NULL DEFAULT 0,
  is_open boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX users_wallet_address_idx ON users(wallet_address);
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX active_positions_user_id_idx ON active_positions(user_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Enable read access for all users"
  ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON users
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for users based on wallet_address"
  ON users
  FOR UPDATE
  USING (true);

-- Create policies for orders table
CREATE POLICY "Enable read access for all users"
  ON orders
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON orders
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON orders
  FOR UPDATE
  USING (true);

-- Create policies for active_positions table
CREATE POLICY "Enable read access for all users"
  ON active_positions
  FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON active_positions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON active_positions
  FOR UPDATE
  USING (true); 