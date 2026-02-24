-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    phone TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Spare parts table
CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    description TEXT,
    car_model TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'failed')
    ),
    order_status TEXT NOT NULL DEFAULT 'booked' CHECK (
        order_status IN (
            'booked',
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled'
        )
    ),
    invoice_url TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    order_id UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    spare_part_id UUID NOT NULL REFERENCES spare_parts (id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

-- Khatabook table
CREATE TABLE IF NOT EXISTS khatabook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    customer_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders (id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    pending_amount NUMERIC(10, 2) NOT NULL CHECK (pending_amount >= 0),
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'paid', 'overdue')
    ),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    redirect_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders (user_id);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_spare_parts_car_model ON spare_parts (car_model);

CREATE INDEX IF NOT EXISTS idx_khatabook_customer_id ON khatabook (customer_id);

CREATE INDEX IF NOT EXISTS idx_khatabook_status ON khatabook (status);

CREATE INDEX IF NOT EXISTS idx_ads_active ON ads (active);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE spare_parts ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE khatabook ENABLE ROW LEVEL SECURITY;

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic examples - customize as needed)

-- Users: Users can read their own data, admins can read all
CREATE POLICY "Users can view own data" ON users FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Admins can view all users" ON users FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

-- Spare parts: Everyone can view, only admins can modify
CREATE POLICY "Anyone can view spare parts" ON spare_parts FOR
SELECT USING (true);

CREATE POLICY "Admins can insert spare parts" ON spare_parts FOR
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

CREATE POLICY "Admins can update spare parts" ON spare_parts FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

CREATE POLICY "Admins can delete spare parts" ON spare_parts FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- Orders: Users can view their own orders, admins can view all
CREATE POLICY "Users can view own orders" ON orders FOR
SELECT USING (auth.uid () = user_id);

CREATE POLICY "Admins can view all orders" ON orders FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

CREATE POLICY "Users can create orders" ON orders FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

CREATE POLICY "Admins can update orders" ON orders FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- Order items: Follow same rules as orders
CREATE POLICY "Users can view own order items" ON order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM orders
            WHERE
                orders.id = order_items.order_id
                AND orders.user_id = auth.uid ()
        )
    );

CREATE POLICY "Admins can view all order items" ON order_items FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

-- Ads: Everyone can view active ads, admins can manage
CREATE POLICY "Anyone can view active ads" ON ads FOR
SELECT USING (
        active = true
        OR EXISTS (
            SELECT 1
            FROM users
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage ads" ON ads FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);

-- Khatabook: Users can view their own entries, admins can view and manage all
CREATE POLICY "Users can view own khatabook" ON khatabook FOR
SELECT USING (auth.uid () = customer_id);

CREATE POLICY "Admins can view all khatabook" ON khatabook FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE
                id = auth.uid ()
                AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage khatabook" ON khatabook FOR ALL USING (
    EXISTS (
        SELECT 1
        FROM users
        WHERE
            id = auth.uid ()
            AND role = 'admin'
    )
);