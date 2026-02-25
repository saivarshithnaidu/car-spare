'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OAuthButtons() {
    const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
    const [isLoadingFacebook, setIsLoadingFacebook] = useState(false);

    const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
        if (provider === 'google') setIsLoadingGoogle(true);
        if (provider === 'facebook') setIsLoadingFacebook(true);

        try {
            // Push browser directly to Next.js reverse-proxy rewrite for Supabase
            // This prevents Supabase domain from being directly evaluated/blocked by aggressive Indian ISPs (like Jio/Airtel)
            const origin = window.location.origin;
            const callbackUrl = encodeURIComponent(`${origin}/auth/callback`);

            // Reconstruct exactly what Supabase does, but point to our Vercel Rewrite map
            window.location.href = `/auth/v1/authorize?provider=${provider}&redirect_to=${callbackUrl}`;
        } catch (error: any) {
            toast.error(error.message || `Failed to sign in with ${provider}`);
            if (provider === 'google') setIsLoadingGoogle(false);
            if (provider === 'facebook') setIsLoadingFacebook(false);
        }
    };

    return (
        <div className="flex flex-col space-y-3 mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 rounded-lg">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button
                variant="outline"
                type="button"
                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                onClick={() => handleOAuthSignIn('google')}
                disabled={isLoadingGoogle || isLoadingFacebook}
            >
                {isLoadingGoogle ? (
                    <Loader className="w-5 h-5 mr-no animate-spin" />
                ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25C22.56 11.47 22.49 10.74 22.37 10.04H12V14.23H17.92C17.67 15.58 16.91 16.73 15.77 17.49V20.24H19.33C21.41 18.33 22.56 15.55 22.56 12.25Z" fill="#4285F4" />
                        <path d="M12 23C14.97 23 17.46 22.02 19.33 20.24L15.77 17.49C14.76 18.17 13.49 18.57 12 18.57C9.11 18.57 6.66 16.61 5.77 13.99H2.09V16.84C3.92 20.48 7.68 23 12 23Z" fill="#34A853" />
                        <path d="M5.77 13.99C5.54 13.3 5.41 12.57 5.41 11.82C5.41 11.07 5.54 10.34 5.77 9.65V6.8H2.09C1.33 8.32 0.899994 10.02 0.899994 11.82C0.899994 13.62 1.33 15.32 2.09 16.84L5.77 13.99Z" fill="#FBBC05" />
                        <path d="M12 5.07C13.62 5.07 15.06 5.63 16.2 6.72L19.4 3.52C17.45 1.7 14.97 0.619995 12 0.619995C7.68 0.619995 3.92 3.14 2.09 6.8L5.77 9.65C6.66 7.03 9.11 5.07 12 5.07Z" fill="#EA4335" />
                    </svg>
                )}
                {isLoadingGoogle ? 'Signing in...' : 'Sign in with Google'}
            </Button>

            <Button
                type="button"
                className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white border-transparent font-medium"
                onClick={() => handleOAuthSignIn('facebook')}
                disabled={isLoadingGoogle || isLoadingFacebook}
            >
                {isLoadingFacebook ? (
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M24 12.073C24 5.405 18.627 0 12 0C5.373 0 0 5.405 0 12.073C0 18.106 4.425 23.095 10.125 24V15.562H7.078V12.073H10.125V9.414C10.125 6.42 11.91 4.767 14.654 4.767C15.962 4.767 17.332 5.002 17.332 5.002V7.98H15.823C14.336 7.98 13.875 8.914 13.875 9.873V12.073H17.188L16.658 15.562H13.875V24C19.575 23.095 24 18.106 24 12.073Z" />
                    </svg>
                )}
                {isLoadingFacebook ? 'Signing in...' : 'Sign in with Facebook'}
            </Button>
        </div>
    );
}
