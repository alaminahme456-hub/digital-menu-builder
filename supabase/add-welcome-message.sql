-- Add welcome_message column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '';
