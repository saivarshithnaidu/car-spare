-- DIAGNOSTIC: Check if your user exists in both auth and users table
-- Run this first to see what's happening

-- 1. Check if you exist in auth.users (Supabase Auth)
SELECT id, email, created_at
FROM auth.users
WHERE
    email = 'saivarshith8284@gmail.com';

-- 2. Check if you exist in the users table
SELECT id, email, role, created_at
FROM users
WHERE
    email = 'saivarshith8284@gmail.com';

-- If you see a result in #1 but NOT in #2, that's the problem!
-- Your auth user exists but the users table record doesn't.

-- SOLUTION: Insert your user manually into the users table
-- First, get your auth user ID from the result above, then:

INSERT INTO
    users (id, email, role, phone)
SELECT id, email, 'admin', NULL
FROM auth.users
WHERE
    email = 'saivarshith8284@gmail.com' ON CONFLICT (id) DO
UPDATE
SET role = 'admin';

-- Verify it worked
SELECT id, email, role, created_at
FROM users
WHERE
    email = 'saivarshith8284@gmail.com';

-- You should now see role = 'admin'