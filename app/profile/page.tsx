'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, CreditCard, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [khatabookBalance, setKhatabookBalance] = useState(0);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    async function checkAuthAndFetch() {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            // Not logged in, redirect to login
            router.replace('/login');
            return;
        }

        setChecking(false);
        fetchUserData(authUser.id);
    }

    async function fetchUserData(userId: string) {
        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        setUser(userData);

        // Fetch khatabook balance
        const { data: khatabookData } = await supabase
            .from('khatabook')
            .select('pending_amount')
            .eq('customer_id', userId)
            .eq('status', 'pending');

        if (khatabookData && khatabookData.length > 0) {
            const total = khatabookData.reduce((sum, entry) => sum + entry.pending_amount, 0);
            setKhatabookBalance(total);
        }
    }

    if (checking || !user) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    My Profile
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <User className="w-5 h-5 mr-2" />
                                Personal Information
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                    <div className="flex items-center mt-1">
                                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                                        <p className="text-gray-900 dark:text-white">{user.email}</p>
                                    </div>
                                </div>

                                {user.phone && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                                        <div className="flex items-center mt-1">
                                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                            <p className="text-gray-900 dark:text-white">{user.phone}</p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Type</label>
                                    <p className="mt-1 text-gray-900 dark:text-white capitalize">{user.role}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</label>
                                    <p className="mt-1 text-gray-900 dark:text-white">
                                        {new Date(user.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Khatabook Balance */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <CreditCard className="w-5 h-5 mr-2" />
                                Khatabook Balance
                            </h2>
                        </CardHeader>
                        <CardBody>
                            {khatabookBalance > 0 ? (
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        Pending payments due
                                    </p>
                                    <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                                        ₹{khatabookBalance.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-4">
                                        Please clear your pending balance at the earliest
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCard className="w-8 h-8 text-green-600 dark:text-green-400" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        All Clear!
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        You have no pending payments
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
