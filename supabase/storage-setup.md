# Supabase Storage Setup

## Required Buckets

### 1. product-images
- **Purpose**: Store product images uploaded by admins
- **Public Access**: Yes (images need to be publicly accessible)
- **File Size Limit**: 5MB recommended
- **Allowed MIME Types**: image/jpeg, image/png, image/webp

**Setup Steps**:
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `product-images`
3. Enable "Public bucket" option
4. Set file size limit to 5242880 bytes (5MB)

**RLS Policy** (if not public):
```sql
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

### 2. invoices
- **Purpose**: Store generated invoice PDFs
- **Public Access**: No (authenticated users only)
- **File Size Limit**: 2MB recommended
- **Allowed MIME Types**: application/pdf

**Setup Steps**:
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `invoices`
3. Keep "Public bucket" disabled
4. Set file size limit to 2097152 bytes (2MB)

**RLS Policy**:
```sql
CREATE POLICY "Users can view own invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all invoices"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'invoices' AND
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "System can upload invoices"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'invoices');
```

### 3. ad-images
- **Purpose**: Store advertisement banners
- **Public Access**: Yes
- **File Size Limit**: 5MB recommended
- **Allowed MIME Types**: image/jpeg, image/png, image/webp

**Setup Steps**:
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `ad-images`
3. Enable "Public bucket" option
4. Set file size limit to 5242880 bytes (5MB)

## File Organization

### Product Images
Path structure: `product-images/{product-id}/{filename}`

### Invoices
Path structure: `invoices/{user-id}/{order-id}.pdf`

### Ad Images
Path structure: `ad-images/{ad-id}/{filename}`

## Getting Public URLs

```typescript
// Product image
const { data } = supabase.storage
  .from('product-images')
  .getPublicUrl('path/to/image.jpg');

// Invoice (authenticated)
const { data } = await supabase.storage
  .from('invoices')
  .createSignedUrl('path/to/invoice.pdf', 3600); // 1 hour expiry
```
