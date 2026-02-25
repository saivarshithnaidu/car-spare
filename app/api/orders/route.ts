import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const paymentStatus = searchParams.get('payment_status'); // for admin

        let query = supabaseServer
            .from('orders')
            .select('*, users(email)')
            .order('created_at', { ascending: false });

        if (userId) {
            query = supabaseServer
                .from('orders')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
        }

        if (paymentStatus && paymentStatus !== 'all') {
            query = query.eq('payment_status', paymentStatus);
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

        const { data, error } = await supabaseServer
            .from('orders')
            .insert(body)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
