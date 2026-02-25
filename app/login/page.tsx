'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock, Loader } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import OAuthButtons from '@/components/auth/OAuthButtons';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        async function checkAuth() {
            try {
                const res = await fetch('/api/auth/me');
                if (!res.ok) {
                    setChecking(false);
                    return;
                }
                const data = await res.json();
                const user = data?.user;
                if (user) {
                    // Already logged in, redirect to home
                    router.push('/');
                    router.refresh();
                } else {
                    setChecking(false);
                }
            } catch (err) {
                console.error('Unexpected error during auth check:', err);
                setChecking(false);
            }
        }
        checkAuth();
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            await signIn(email, password);
            toast.success('Logged in successfully');
            router.push('/');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to login');
            setLoading(false);
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
            <div className="max-w-md mx-auto">
                <Link href="/" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Link>

                <Card className="mt-6">
                    <CardHeader>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                            Welcome Back
                        </h1>
                        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                            Sign in to your account
                        </p>
                    </CardHeader>

                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                            />

                            <Input
                                label="Password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </Button>
                        </form>

                        <OAuthButtons />

                        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                            Don't have an account?{' '}
                            <Link href="/signup" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                                Sign up
                            </Link>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
