import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'mark-paid') {
            let { error } = await supabaseServer.rpc('mark_khatabook_paid', { entry_id: id });

            if (error) {
                // Fallback if RPC doesn't exist
                const fallbackResult = await supabaseServer
                    .from('khatabook')
                    .update({ status: 'paid', pending_amount: 0 })
                    .eq('id', id);
                error = fallbackResult.error as any;
            }

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }
            return NextResponse.json({ success: true });
        }

        const body = await request.json();

        const { error } = await supabaseServer
            .from('khatabook')
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
