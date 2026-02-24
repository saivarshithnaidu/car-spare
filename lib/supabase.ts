import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client-side Supabase client (safe for browser, syncs auth cookies for SSR)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role (admin operations)
// Only initialize if service role key is available
export const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : createClient(supabaseUrl, supabaseAnonKey); // Fallback to anon client

// Helper to get current user
export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (error || !user) return null;

    // Get user role from users table
    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    return userData;
}

// Helper to check if user is admin
export async function isAdmin() {
    const user = await getCurrentUser();
    return user?.role === 'admin';
}
