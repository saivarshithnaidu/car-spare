-- Add new columns to orders table for invoice and offline billing
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS invoice_url TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;

-- Add image_url to spare_parts
ALTER TABLE public.spare_parts
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create ads table for banner uploads
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Ads
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Allow public read access to ads
DROP POLICY IF EXISTS "Public can view active ads" ON public.ads;

CREATE POLICY "Public can view active ads" ON public.ads FOR
SELECT USING (active = true);

-- Allow admin full access to ads
DROP POLICY IF EXISTS "Admins can manage ads" ON public.ads;

CREATE POLICY "Admins can manage ads" ON public.ads FOR ALL USING (
    auth.uid () IN (
        SELECT id
        FROM public.users
        WHERE
            role = 'admin'
    )
);

-- Create Storage Buckets (Note: policies for storage.objects need to be created if not existing)
INSERT INTO
    storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    storage.buckets (id, name, public)
VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;

INSERT INTO
    storage.buckets (id, name, public)
VALUES ('ads', 'ads', true) ON CONFLICT (id) DO NOTHING;

-- Set up basic storage policies (Public read, Admin all)

-- Products Bucket
DROP POLICY IF EXISTS "Public Access to Products" ON storage.objects;

DROP POLICY IF EXISTS "Admin Upload to Products" ON storage.objects;

DROP POLICY IF EXISTS "Admin Update Products" ON storage.objects;

DROP POLICY IF EXISTS "Admin Delete Products" ON storage.objects;

CREATE POLICY "Public Access to Products" ON storage.objects FOR
SELECT USING (bucket_id = 'products');

CREATE POLICY "Admin Upload to Products" ON storage.objects FOR
INSERT
WITH
    CHECK (
        bucket_id = 'products'
        AND (
            auth.uid () IN (
                SELECT id
                FROM public.users
                WHERE
                    role = 'admin'
            )
        )
    );

CREATE POLICY "Admin Update Products" ON storage.objects FOR
UPDATE USING (
    bucket_id = 'products'
    AND (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                role = 'admin'
        )
    )
);

CREATE POLICY "Admin Delete Products" ON storage.objects FOR DELETE USING (
    bucket_id = 'products'
    AND (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                role = 'admin'
        )
    )
);

-- Ads Bucket
DROP POLICY IF EXISTS "Public Access to Ads" ON storage.objects;

DROP POLICY IF EXISTS "Admin Upload to Ads" ON storage.objects;

DROP POLICY IF EXISTS "Admin Update Ads" ON storage.objects;

DROP POLICY IF EXISTS "Admin Delete Ads" ON storage.objects;

CREATE POLICY "Public Access to Ads" ON storage.objects FOR
SELECT USING (bucket_id = 'ads');

CREATE POLICY "Admin Upload to Ads" ON storage.objects FOR
INSERT
WITH
    CHECK (
        bucket_id = 'ads'
        AND (
            auth.uid () IN (
                SELECT id
                FROM public.users
                WHERE
                    role = 'admin'
            )
        )
    );

CREATE POLICY "Admin Update Ads" ON storage.objects FOR
UPDATE USING (
    bucket_id = 'ads'
    AND (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                role = 'admin'
        )
    )
);

CREATE POLICY "Admin Delete Ads" ON storage.objects FOR DELETE USING (
    bucket_id = 'ads'
    AND (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                role = 'admin'
        )
    )
);

-- Invoices Bucket
DROP POLICY IF EXISTS "Public Access to Invoices" ON storage.objects;

DROP POLICY IF EXISTS "Admin Upload to Invoices" ON storage.objects;

DROP POLICY IF EXISTS "Admin Update Invoices" ON storage.objects;

DROP POLICY IF EXISTS "Admin Delete Invoices" ON storage.objects;

CREATE POLICY "Public Access to Invoices" ON storage.objects FOR
SELECT USING (bucket_id = 'invoices');

CREATE POLICY "Admin Upload to Invoices" ON storage.objects FOR
INSERT
WITH
    CHECK (
        bucket_id = 'invoices'
        AND (
            auth.uid () IN (
                SELECT id
                FROM public.users
                WHERE
                    role = 'admin'
            )
        )
    );

CREATE POLICY "Admin Update Invoices" ON storage.objects FOR
UPDATE USING (
    bucket_id = 'invoices'
    AND (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                role = 'admin'
        )
    )
);

CREATE POLICY "Admin Delete Invoices" ON storage.objects FOR DELETE USING (
    bucket_id = 'invoices'
    AND (
        auth.uid () IN (
            SELECT id
            FROM public.users
            WHERE
                role = 'admin'
        )
    )
);