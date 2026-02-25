import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        let query = supabaseServer
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (role) {
            query = supabaseServer
                .from('users')
                .select(`
            id, email, full_name, phone, district, state,
            created_at, last_login, profile_completed, is_vip
        `)
                .eq('role', role)
                .order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { error } = await supabaseServer
            .from('users')
            .insert(body);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
