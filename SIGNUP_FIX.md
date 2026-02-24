# ⚡ Quick Fix for Signup/Login Issues

## Problem: "Email rate limit exceeded"

This is a **Supabase rate limiting** issue on the free tier. Here are your options:

---

## ✅ IMMEDIATE SOLUTIONS

### Option 1: Wait 60 Minutes
Supabase free tier limits email signups. **Wait 1 hour** and try again.

### Option 2: Use Different Email
Try signing up with a different email address.

### Option 3: Disable Email Confirmations (Recommended for Testing)
1. Go to: https://supabase.com/dashboard/project/vcmjzcpgeukmwhrkyypy/auth/providers
2. Scroll to **"Email Auth"** section
3. **Turn OFF** "Confirm email"
4. Click **Save**
5. Try signing up again immediately!

### Option 4: Check Your Supabase Database

**CRITICAL: Did you run the database schema?**

1. Go to: https://supabase.com/dashboard/project/vcmjzcpgeukmwhrkyypy/editor
2. Click **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy the ENTIRE contents of `supabase/schema.sql`
5. Paste it into the SQL editor
6. Click **"Run"** (or Ctrl+Enter)
7. You should see success messages

**Without this step, signups will fail!**

---

## 🔍 Verify Setup

After running the schema, verify tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see: `users`, `spare_parts`, `orders`, `order_items`, `khatabook`, `ads`

---

## 🎯 Test Signup After Fix

1. Make sure email confirmation is OFF (Option 3 above)
2. Make sure database schema is created (Option 4 above)
3. Try signup with any email
4. Should work immediately!

---

## 📝 Next Steps After Signup Works

1. Create an admin user:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```

2. Add some test products in admin panel

3. Test the complete flow!
