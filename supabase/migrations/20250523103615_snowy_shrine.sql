/*
  # Add wallet_address column to users table

  1. Changes
    - Add `wallet_address` column to users table
    - Create index on wallet_address for faster lookups
    - Update RLS policies to use wallet_address
*/

-- Add wallet_address column
ALTER TABLE users ADD COLUMN IF NOT EXISTS wallet_address text;
CREATE UNIQUE INDEX IF NOT EXISTS users_wallet_address_idx ON users(wallet_address);

-- Update RLS policies to use wallet_address
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (wallet_address = auth.jwt()->>'wallet_address');

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  USING (wallet_address = auth.jwt()->>'wallet_address');