import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const provider = searchParams.get('provider');

        if (!provider || (provider !== 'google' && provider !== 'facebook')) {
            return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
        }

        const supabase = await createClient();

        // Construct the callback URL dynamically based on the request host
        const url = new URL(request.url);
        const redirectUrl = `${url.protocol}//${url.host}/auth/callback`;

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: redirectUrl,
            },
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        if (data.url) {
            return NextResponse.redirect(data.url);
        }

        return NextResponse.json({ error: 'Failed to generate OAuth URL' }, { status: 500 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
