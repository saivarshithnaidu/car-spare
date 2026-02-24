-- Drop the existing constraint
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_payment_method_check;

-- Add the updated constraint including new dynamic options
ALTER TABLE orders
ADD CONSTRAINT orders_payment_method_check CHECK (
    payment_method IN (
        'razorpay',
        'cod',
        'pod',
        'offline',
        'cash',
        'upi',
        'credit'
    )
);