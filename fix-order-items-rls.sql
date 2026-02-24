-- Fix RLS policies for order_items table to allow COD/POD orders

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;

DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;

-- Create new permissive policies for order_items
CREATE POLICY "Users can insert order items" ON order_items FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE
                orders.id = order_items.order_id
                AND orders.user_id = auth.uid ()
        )
    );

CREATE POLICY "Users can view own order items" ON order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE
                orders.id = order_items.order_id
                AND (
                    orders.user_id = auth.uid ()
                    OR EXISTS (
                        SELECT 1
                        FROM users
                        WHERE
                            users.id = auth.uid ()
                            AND users.role = 'admin'
                    )
                )
        )
    );

-- Verify policies were created
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE
    tablename = 'order_items';