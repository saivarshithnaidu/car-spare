-- Make saivarshith8284@gmail.com an admin
-- Run this in Supabase SQL Editor after the user has signed up

UPDATE users
SET role = 'admin'
WHERE
    email = 'saivarshith8284@gmail.com';

-- Verify the change
SELECT id, email, role, created_at
FROM users
WHERE
    email = 'saivarshith8284@gmail.com';