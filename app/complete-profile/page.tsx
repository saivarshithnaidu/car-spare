'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function CompleteProfilePage() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);

    // Form states
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [district, setDistrict] = useState('');
    const [stateName, setStateName] = useState('');
    const [pincode, setPincode] = useState('');

    useEffect(() => {
        async function checkAuthAndProfile() {
            try {
                const { data, error } = await supabase.auth.getUser();
                const user = data?.user;

                if (error || !user) {
                    router.replace('/login');
                    return;
                }

                setUserId(user.id);

                // Fetch current user details from 'users' table
                const res = await fetch(`/api/users/${user.id}`);
                if (!res.ok) throw new Error('User not found');
                const userData = await res.json();
                const userError = null;

                if (!userError && userData) {
                    if (userData.profile_completed) {
                        // Profile is already completed, redirect to home
                        router.replace('/');
                        return;
                    }

                    // Pre-fill if any data exists
                    if (userData.full_name) setFullName(userData.full_name);
                    if (userData.phone) setPhone(userData.phone);
                    if (userData.address) setAddress(userData.address);
                    if (userData.district) setDistrict(userData.district);
                    if (userData.state) setStateName(userData.state);
                    if (userData.pincode) setPincode(userData.pincode);
                }
            } catch (err) {
                console.error('Error checking profile:', err);
            } finally {
                setChecking(false);
            }
        }

        checkAuthAndProfile();
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        // Basic validations
        if (phone.length < 10) {
            toast.error('Please enter a valid phone number');
            return;
        }

        if (!pincode || pincode.length !== 6) {
            toast.error('Please enter a valid 6-digit pincode');
            return;
        }

        setLoading(true);

        try {
            if (!userId) {
                throw new Error('User ID not found');
            }

            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    phone,
                    address,
                    district,
                    state: stateName,
                    pincode,
                    profile_completed: true,
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'Failed to update profile');
            }

            toast.success('Profile completed successfully!');
            router.push('/');
            router.refresh();
        } catch (error: any) {
            console.error('Update required profile error:', error);
            toast.error(error.message || 'Failed to update profile');
        } finally {
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
            <div className="max-w-2xl mx-auto">
                <Card className="mt-6">
                    <CardHeader>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center">
                            Complete Your Profile
                        </h1>
                        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
                            Please provide your details to continue shopping
                        </p>
                    </CardHeader>

                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Full Name"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />

                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="9876543210"
                                    required
                                />
                            </div>

                            <Input
                                label="Complete Address"
                                type="text"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="123 Main Street, Apt 4B"
                                required
                            />

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input
                                    label="District/City"
                                    type="text"
                                    value={district}
                                    onChange={(e) => setDistrict(e.target.value)}
                                    placeholder="e.g. Mumbai"
                                    required
                                />

                                <Input
                                    label="State"
                                    type="text"
                                    value={stateName}
                                    onChange={(e) => setStateName(e.target.value)}
                                    placeholder="e.g. Maharashtra"
                                    required
                                />

                                <Input
                                    label="Pincode"
                                    type="text"
                                    value={pincode}
                                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="123456"
                                    required
                                    maxLength={6}
                                />
                            </div>

                            <Button
                                type="submit"
                                size="lg"
                                className="w-full mt-8"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                                        Saving Profile...
                                    </>
                                ) : (
                                    'Complete Profile & Continue'
                                )}
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
