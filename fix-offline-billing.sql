-- Fix for Offline Billing
-- Allow user_id to be NULL for walk-in customers
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Allow admins to insert into orders
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;

CREATE POLICY "Admins can insert orders" ON orders FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

-- Allow admins to insert into order_items
DROP POLICY IF EXISTS "Admins can insert order items" ON order_items;

CREATE POLICY "Admins can insert order items" ON order_items FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );