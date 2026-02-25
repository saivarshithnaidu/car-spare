import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        // Fetch order details with joined users and order_items
        const { data, error } = await supabaseServer
            .from('orders')
            .select(`
          *,
          users:user_id(email, full_name, phone, address, district, state, pincode),
          order_items(*, spare_part:spare_part_id(*))
      `)
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }

        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { error } = await supabaseServer
            .from('orders')
            .update(body)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
