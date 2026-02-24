import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup')
    const isApiRoute = request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.startsWith('/auth')
    const isCompleteProfileRoute = request.nextUrl.pathname.startsWith('/complete-profile')

    if (user) {
        if (isAuthRoute) {
            // Redirect authenticated users away from auth pages
            const url = request.nextUrl.clone()
            url.pathname = '/'
            return NextResponse.redirect(url)
        }

        // Check if Profile is Complete (Skip API and Auth system routes to avoid loops/errors)
        if (!isApiRoute) {
            const { data: userData } = await supabase
                .from('users')
                .select('profile_completed, role')
                .eq('id', user.id)
                .single()

            const isProfileComplete = userData?.profile_completed
            const isRoleAdmin = userData?.role === 'admin'
            const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')

            // Protect Admin Routes
            if (isAdminRoute && !isRoleAdmin) {
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }

            if (!isProfileComplete && !isCompleteProfileRoute) {
                // Redirect user to complete profile
                const url = request.nextUrl.clone()
                url.pathname = '/complete-profile'
                return NextResponse.redirect(url)
            }

            if (isProfileComplete && isCompleteProfileRoute) {
                // If already complete, prevent accessing setup page again
                const url = request.nextUrl.clone()
                url.pathname = '/'
                return NextResponse.redirect(url)
            }
        }
    }

    return supabaseResponse
}
