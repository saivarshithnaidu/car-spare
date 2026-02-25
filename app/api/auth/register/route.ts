import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const { email, password, phone } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error || !data.user) {
            return NextResponse.json({ error: error?.message || 'Failed to create account' }, { status: 400 });
        }

        const { error: userError } = await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email!,
            role: 'customer',
            phone: phone || null,
        });

        if (userError) {
            return NextResponse.json({ error: 'Failed to create user profile' }, { status: 400 });
        }

        return NextResponse.json({ user: data.user });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
