'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Package, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function OrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    async function checkAuthAndFetch() {
        const res = await fetch('/api/auth/me');

        if (!res.ok) {
            // Not logged in, redirect to login
            router.replace('/login');
            return;
        }

        const { user } = await res.json();

        setChecking(false);
        fetchOrders(user.id);
    }

    async function fetchOrders(userId: string) {
        try {
            const res = await fetch(`/api/orders?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
        }
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900',
            paid: 'text-green-600 bg-green-100 dark:bg-green-900',
            failed: 'text-red-600 bg-red-100 dark:bg-red-900',
        };
        return colors[status] || 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    };

    if (checking || loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 flex items-center justify-center">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12">
                <Card className="text-center p-12 max-w-md mx-4">
                    <CardBody>
                        <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            No orders yet
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Start shopping to see your orders here
                        </p>
                        <Button onClick={() => router.push('/products')}>
                            Browse Products
                        </Button>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    My Orders
                </h1>

                <div className="space-y-4">
                    {orders.map((order) => (
                        <Card key={order.id}>
                            <CardBody>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                Order #{order.id.substring(0, 8).toUpperCase()}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.payment_status)}`}>
                                                {order.payment_status.toUpperCase()}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900">
                                                {order.order_status.toUpperCase()}
                                            </span>
                                        </div>

                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Ordered on {new Date(order.created_at).toLocaleDateString('en-IN', {
                                                dateStyle: 'medium'
                                            })}
                                        </p>

                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                            ₹{order.total_amount.toFixed(2)}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {order.invoice_url && order.payment_status === 'paid' && (
                                            <a href={order.invoice_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Invoice
                                                </Button>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
