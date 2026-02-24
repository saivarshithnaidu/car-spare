-- Add admin tracking and VIP fields to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP
WITH
    TIME ZONE,
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT false;

-- Enhance khatabook table with notes if not present
ALTER TABLE public.khatabook ADD COLUMN IF NOT EXISTS notes TEXT;