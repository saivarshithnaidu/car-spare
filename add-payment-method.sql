-- Add payment_method column to orders table if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'razorpay';

-- Add check constraint for valid payment methods
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'orders_payment_method_check'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_payment_method_check 
        CHECK (payment_method IN ('razorpay', 'cod', 'pod'));
    END IF;
END $$;

-- Update existing orders to have razorpay as default
UPDATE orders
SET
    payment_method = 'razorpay'
WHERE
    payment_method IS NULL;

-- Verify the change
SELECT
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE
    table_name = 'orders'
    AND column_name = 'payment_method';