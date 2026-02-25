import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const { data, error } = await supabaseServer
            .from('order_items')
            .insert(body)
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
