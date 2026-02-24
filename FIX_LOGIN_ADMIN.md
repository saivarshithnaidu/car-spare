# 🔧 Fix Login & Admin Issues - STEP BY STEP

## Problem
You're logged in but the navbar still shows "Login/Sign Up" and no admin access.

## Root Cause
The `users` table doesn't have proper INSERT policies, so when you sign up, your user record isn't being created in the `users` table (only in Supabase Auth).

---

## ✅ SOLUTION (Do these in order)

### Step 1: Run the Full Database Schema
1. Go to: https://supabase.com/dashboard/project/vcmjzcpgeukmwhrkyypy/editor
2. Click "New Query"
3. Copy **ALL** of `supabase/schema.sql` 
4. Paste and click **"Run"**

### Step 2: Add Missing INSERT Policy
Run this SQL to allow users to insert themselves:

```sql
CREATE POLICY "Users can insert own data" ON users
FOR INSERT
WITH CHECK (auth.uid() = id);
```

### Step 3: Logout and Sign Up Again
**IMPORTANT:** Since your user wasn't added to the `users` table, you need to:
1. Click logout in the app
2. Sign up again with `saivarshith8284@gmail.com`
3. This time it will insert into the `users` table

### Step 4: Make Yourself Admin
After signing up, run this:

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'saivarshith8284@gmail.com';

-- Verify it worked
SELECT * FROM users WHERE email = 'saivarshith8284@gmail.com';
```

### Step 5: Add Sample Products
Run this to add some test products:

```sql
INSERT INTO spare_parts (name, description, car_model, price, stock_quantity)
VALUES 
('Engine Oil Filter', 'High-quality oil filter', 'Honda City', 450.00, 50),
('Brake Pads', 'Premium ceramic brake pads', 'Toyota Innova', 2500.00, 30),
('Air Filter', 'Cleanable air filter', 'Maruti Swift', 350.00, 45);
```

### Step 6: Refresh & Test
1. **Hard refresh** the browser (Ctrl+Shift+R)
2. You should now see:
   - ✅ User menu (Orders, Profile, Logout icons)
   - ✅ "Admin" link in navbar
   - ✅ Products showing on products page

---

## 🎯 Quick All-in-One SQL

I've created `fix-login-admin.sql` with all the SQL you need. Just:
1. Open Supabase SQL Editor
2. Run that entire file
3. Logout and signup again
4. Hard refresh browser

---

## 🔍 How to Verify It's Fixed

After following steps, check:
- [ ] Navbar shows user icons instead of "Login/Sign Up"
- [ ] "Admin" link appears in navbar
- [ ] `/admin/dashboard` loads without redirect
- [ ] Products page shows products
- [ ] Profile shows your email and role

If still not working, **hard refresh** (Ctrl+Shift+R) or clear browser cache!
