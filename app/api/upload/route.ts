import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const bucket = formData.get('bucket') as string;
        const path = formData.get('path') as string;

        if (!file || !bucket || !path) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: uploadData, error: uploadError } = await supabaseServer.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            return NextResponse.json({ error: uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabaseServer.storage
            .from(bucket)
            .getPublicUrl(path);

        return NextResponse.json({ url: publicUrl }, { status: 201 });
    } catch (err: any) {
        console.error('API Upload Error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
