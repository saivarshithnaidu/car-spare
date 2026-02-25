import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        const supabase = await createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (data.user) {
            await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);
        }

        return NextResponse.json({ user: data.user });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
