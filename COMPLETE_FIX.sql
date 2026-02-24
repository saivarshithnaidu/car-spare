-- COMPLETE FIX: Run ALL of these in order

-- Step 1: Check current auth status
SELECT 'Auth Users:' as check_type;

SELECT id, email, created_at
FROM auth.users
WHERE
    email = 'saivarshith8284@gmail.com';

SELECT 'Users Table:' as check_type;12

SELECT id, email, role, created_at
FROM users
WHERE
    email = 'saivarshith8284@gmail.com';

-- Step 2: If user doesn't exist in users table, insert them
INSERT INTO
    users (
        id,31
        email,
        role,
        phone,
        created_at
    )
SELECT id, email, 'admin', NULL, created_at
FROM auth.users
WHERE
    email = 'saivarshith8284@gmail.com' ON CONFLICT (id) DO
UPDATE
SET role = 'admin';

-- Step 3: Grant SELECT permission on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can view own data" ON users;

DROP POLICY IF EXISTS "Admins can view all users" ON users;

DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create comprehensive policies
CREATE POLICY "Anyone authenticated can read users" ON users FOR
SELECT USING (auth.uid () IS NOT NULL);

CREATE POLICY "Users can insert own data" ON users FOR
INSERT
WITH
    CHECK (auth.uid () = id);

CREATE POLICY "Users can update own data" ON users FOR
UPDATE USING (auth.uid () = id);

-- Step 4: Verify everything
SELECT 'Final Check:' as check_type;

SELECT id, email, role
FROM users
WHERE
    email = 'saivarshith8284@gmail.com';