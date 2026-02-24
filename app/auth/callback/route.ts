import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { supabaseAdmin } from '@/lib/supabase'; // Using admin client to safely insert users without RLS issues

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await createClient();

        // Exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data.user) {
            // Check if user already exists in the local 'users' table
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('id', data.user.id)
                .single();

            // If user doesn't exist, create them
            if (!existingUser) {
                const { error: insertError } = await supabaseAdmin
                    .from('users')
                    .insert({
                        id: data.user.id,
                        email: data.user.email!,
                        role: 'customer',
                    });

                if (insertError) {
                    console.error('Error inserting new user from OAuth callback:', insertError);
                }
            } else {
                // Update last_login for existing user
                const { error: updateError } = await supabaseAdmin
                    .from('users')
                    .update({ last_login: new Date().toISOString() })
                    .eq('id', data.user.id);

                if (updateError) {
                    console.error('Error updating last_login from OAuth callback:', updateError);
                }
            }

            return NextResponse.redirect(`${requestUrl.origin}${next}`);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${requestUrl.origin}/login?error=Could not authenticate user`);
}
