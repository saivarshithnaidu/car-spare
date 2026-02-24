-- COMPREHENSIVE FIX FOR LOGIN/ADMIN ISSUES
-- Run this in Supabase SQL Editor

-- Step 1: Check if users table exists and has data
SELECT * FROM users;

-- Step 2: If the table is empty or the user doesn't exist, we need to add insert policy
-- Drop existing policies that might be blocking inserts
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create policy to allow users to insert themselves
CREATE POLICY "Users can insert own data" ON users FOR
INSERT
WITH
    CHECK (auth.uid () = id);

-- Step 3: Make saivarshith8284@gmail.com an admin (run AFTER signup)
UPDATE users
SET role = 'admin'
WHERE
    email = 'saivarshith8284@gmail.com';

-- Step 4: Verify the user exists and is admin
SELECT id, email, role, created_at
FROM users
WHERE
    email = 'saivarshith8284@gmail.com';

-- Step 5: Add some sample products so the store isn't empty
INSERT INTO
    spare_parts (
        name,
        description,
        car_model,
        price,
        stock_quantity,
        image_url
    )
VALUES (
        'Engine Oil Filter',
        'High-quality oil filter for better engine performance',
        'Honda City',
        450.00,
        50,
        NULL
    ),
    (
        'Brake Pads',
        'Premium ceramic brake pads',
        'Toyota Innova',
        2500.00,
        30,
        NULL
    ),
    (
        'Air Filter',
        'Cleanable air filter for improved fuel efficiency',
        'Maruti Swift',
        350.00,
        45,
        NULL
    ),
    (
        'Spark Plugs',
        'Iridium spark plugs set of 4',
        'Hyundai i20',
        800.00,
        60,
        NULL
    ),
    (
        'Headlight Bulb',
        'LED headlight bulb - bright white',
        'Honda Civic',
        1200.00,
        25,
        NULL
    );

-- Step 6: Verify products were added
SELECT id, name, car_model, price, stock_quantity FROM spare_parts;