-- ============================================
-- MASTER FIX SCRIPT FOR CAR SPARE PARTS PLATFORM
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Step 1: Verify and fix RLS policies
-- ============================================

-- Drop all existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own data" ON users;

DROP POLICY IF EXISTS "Admins can view all users" ON users;

DROP POLICY IF EXISTS "Users can insert own data" ON users;

DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new comprehensive policies
CREATE POLICY "Authenticated users can read users" ON users FOR
SELECT USING (auth.uid () IS NOT NULL);

CREATE POLICY "Users can insert themselves" ON users FOR
INSERT
WITH
    CHECK (auth.uid () = id);

CREATE POLICY "Users can update own profile" ON users FOR
UPDATE USING (auth.uid () = id);

-- Step 2: Insert/Update admin user
-- ============================================
INSERT INTO
    users (
        id,
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

-- Step 3: Verify admin user
-- ============================================
SELECT 'Admin User Check:' as step;

SELECT id, email, role, created_at
FROM users
WHERE
    email = 'saivarshith8284@gmail.com';

-- Step 4: Add sample products (if none exist)
-- ============================================
INSERT INTO
    spare_parts (
        name,
        description,
        car_model,
        price,
        stock_quantity
    )
SELECT *
FROM (
        VALUES (
                'Premium Engine Oil Filter', 'High-quality oil filter for superior engine protection and performance', 'Honda City', 450.00, 50
            ), (
                'Ceramic Brake Pads Set', 'Premium ceramic brake pads for optimal stopping power', 'Toyota Innova', 2500.00, 30
            ), (
                'High-Flow Air Filter', 'Performance air filter for improved fuel efficiency', 'Maruti Swift', 350.00, 45
            ), (
                'Iridium Spark Plugs (Set of 4)', 'Long-lasting iridium spark plugs for better ignition', 'Hyundai i20', 800.00, 60
            ), (
                'LED Headlight Bulb', 'Bright white LED headlight for better visibility', 'Honda Civic', 1200.00, 25
            ), (
                'Cabin Air Filter', 'HEPA cabin filter for clean air inside vehicle', 'Maruti Baleno', 280.00, 40
            ), (
                'Front Brake Disc Rotor', 'OEM quality brake disc for safe braking', 'Hyundai Creta', 3200.00, 15
            ), (
                'Fuel Filter', 'High-efficiency fuel filter to protect your engine', 'Tata Nexon', 420.00, 35
            )
    ) AS new_products (
        name, description, car_model, price, stock_quantity
    )
WHERE
    NOT EXISTS (
        SELECT 1
        FROM spare_parts
        LIMIT 1
    );

-- Step 5: Verify products
-- ============================================
SELECT 'Products Check:' as step;

SELECT COUNT(*) as total_products FROM spare_parts;

SELECT
    id,
    name,
    car_model,
    price,
    stock_quantity
FROM spare_parts
LIMIT 5;

-- Step 6: Check orders table is ready
-- ============================================
SELECT 'Orders Table Check:' as step;

SELECT COUNT(*) as total_orders FROM orders;

-- Step 7: Verify all tables exist
-- ============================================
SELECT 'Tables Check:' as step;

SELECT table_name
FROM information_schema.tables
WHERE
    table_schema = 'public'
    AND table_name IN (
        'users',
        'spare_parts',
        'orders',
        'order_items',
        'khatabook',
        'ads'
    )
ORDER BY table_name;

-- ============================================
-- VERIFICATION SUMMARY
-- ============================================
SELECT '=== SETUP COMPLETE ===' as status;

SELECT 'Admin email: saivarshith8284@gmail.com' as info
UNION ALL
SELECT 'Check above results to verify:'
UNION ALL
SELECT '1. Admin user exists with role=admin'
UNION ALL
SELECT '2. Products table has sample data'
UNION ALL
SELECT '3. All 6 tables exist';