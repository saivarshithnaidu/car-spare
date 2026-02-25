
export async function signUp(email: string, password: string, phone?: string) {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, phone }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create account');
    }
    const data = await res.json();
    return data.user;
}

export async function signIn(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to login');
    }
    const data = await res.json();
    return data.user;
}

export async function signOut() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to logout');
    }
    // Dispatch event so active components can cleanup
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('authStatusChanged'));
    }
}

export async function getCurrentUser() {
    try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) return null;
        const data = await res.json();
        return data.user;
    } catch {
        return null;
    }
}

export async function checkIsAdmin() {
    const user = await getCurrentUser();
    return user?.role === 'admin';
}
