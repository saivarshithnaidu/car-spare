import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.warn('Missing Supabase environment variables for server client.');
}

// Create a single supabase client for interacting with your database at the server level.
// Uses the Service Role Key to bypass RLS policies and have full admin privileges.
// THIS SHOULD NEVER BE EXPOSED TO THE BROWSER.
export const supabaseServer = createClient(
    supabaseUrl || '',
    supabaseServiceRoleKey || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);
