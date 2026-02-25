import { supabase } from './supabase';

export async function signUp(email: string, password: string, phone?: string) {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError || !authData.user) {
        throw new Error(authError?.message || 'Failed to create account');
    }

    // Insert user into users table with role
    const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: authData.user.id,
            email: authData.user.email!,
            role: 'customer',
            phone: phone || null,
        })
    });

    if (!res.ok) {
        throw new Error('Failed to create user profile');
    }

    return authData.user;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    // Update last_login
    if (data.user) {
        await fetch(`/api/users/${data.user.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ last_login: new Date().toISOString() })
        });
    }

    return data.user;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw new Error(error.message);
    }
}

export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (error || !user) return null;

    // Get user details from users table
    const res = await fetch(`/api/users/${user.id}`);
    if (!res.ok) return null;
    const userData = await res.json();

    return userData;
}

export async function checkIsAdmin() {
    const user = await getCurrentUser();
    return user?.role === 'admin';
}
