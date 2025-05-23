/*
  # Create initial schema for trading platform

  1. New Tables
    - `users`
      - `id` (uuid, primary key) - Wallet address
      - `email` (text)
      - `username` (text)
      - `tier` (text)
      - `stage` (text)
      - `current_balance` (float)
      - `current_pnl` (float)
      - `created_at` (timestamp)

    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `market` (text)
      - `position_type` (text, 'Buy' or 'Sell')
      - `amount` (float)
      - `entry_price` (float)
      - `timestamp` (timestamp)

    - `active_positions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `market` (text)
      - `amount` (float)
      - `entry_price` (float)
      - `current_price` (float)
      - `pnl` (float)
      - `is_open` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text,
  username text NOT NULL,
  tier text NOT NULL DEFAULT 'basic',
  stage text NOT NULL DEFAULT 'demo',
  current_balance float NOT NULL DEFAULT 10000,
  current_pnl float NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  market text NOT NULL,
  position_type text NOT NULL CHECK (position_type IN ('Buy', 'Sell')),
  amount float NOT NULL,
  entry_price float NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Create active_positions table
CREATE TABLE IF NOT EXISTS active_positions (
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

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for orders table
CREATE POLICY "Users can view their own orders"
  ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orders"
  ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for active_positions table
CREATE POLICY "Users can view their own positions"
  ON active_positions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own positions"
  ON active_positions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own positions"
  ON active_positions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);