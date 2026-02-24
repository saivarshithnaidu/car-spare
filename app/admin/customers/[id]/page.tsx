'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Phone, MapPin, Calendar, Clock, Package, DollarSign, Loader, CheckCircle, AlertCircle, TrendingDown, TrendingUp } from 'lucide-react';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function CustomerDetailPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [customer, setCustomer] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [khatabookEntries, setKhatabookEntries] = useState<any[]>([]);

    useEffect(() => {
        if (customerId) {
            fetchCustomerData();
        }
    }, [customerId]);

    async function fetchCustomerData() {
        setLoading(true);

        // Parallel data fetching for performance
        const [userRes, ordersRes, kbRes] = await Promise.all([
            // User Data
            supabase
                .from('users')
                .select('*')
                .eq('id', customerId)
                .single(),
            // Order History
            supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('user_id', customerId)
                .order('created_at', { ascending: false }),
            // Khatabook History
            supabase
                .from('khatabook')
                .select('*')
                .eq('user_id', customerId)
                .order('created_at', { ascending: false })
        ]);

        if (userRes.data) setCustomer(userRes.data);
        if (ordersRes.data) setOrders(ordersRes.data);
        if (kbRes.data) setKhatabookEntries(kbRes.data);

        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="p-8 text-center max-w-lg mx-auto mt-20">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customer Not Found</h2>
                <p className="text-gray-500 mt-2 mb-6">The particular customer you are looking for does not exist or has been removed.</p>
                <Button onClick={() => router.push('/admin/customers')}>Back to Customers</Button>
            </div>
        );
    }

    // Calculations
    const totalOrdersValue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
    const kbTotalCredit = khatabookEntries.reduce((sum, entry) => sum + (entry.total_amount || 0), 0);
    const kbTotalPaid = khatabookEntries.reduce((sum, entry) => sum + (entry.paid_amount || 0), 0);
    const kbTotalPending = khatabookEntries.reduce((sum, entry) => sum + (entry.pending_amount || 0), 0);

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        {customer.full_name || 'Unnamed Customer'}
                        {customer.is_vip && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-sm">
                                VIP
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 mt-1">{customer.email}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <Button variant="outline" onClick={() => router.back()}>
                        Back
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Profile Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Details</h2>
                        </CardHeader>
                        <CardBody className="space-y-5">
                            <div className="flex items-start gap-3">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Phone</p>
                                    <p className="text-gray-900 dark:text-white">{customer.phone || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Address</p>
                                    {customer.address ? (
                                        <p className="text-gray-900 dark:text-white">
                                            {customer.address}<br />
                                            {customer.district}, {customer.state} {customer.pincode}
                                        </p>
                                    ) : (
                                        <p className="text-gray-400 italic">No address on file</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Registered On</p>
                                    <p className="text-gray-900 dark:text-white">
                                        {new Date(customer.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Last Login</p>
                                    <p className="text-gray-900 dark:text-white">
                                        {customer.last_login ? new Date(customer.last_login).toLocaleString() : 'Never'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                {customer.profile_completed ? (
                                    <div className="flex items-center text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                        <CheckCircle className="w-5 h-5 mr-2" />
                                        <span className="font-medium text-sm">Profile 100% Complete</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                        <AlertCircle className="w-5 h-5 mr-2" />
                                        <span className="font-medium text-sm">Incomplete Profile Data</span>
                                    </div>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Quick Stats Mini-Card */}
                    <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none">
                        <CardBody>
                            <h3 className="text-blue-100 font-medium mb-4">Total Value Generated</h3>
                            <div className="text-4xl font-bold mb-1 shadow-sm">
                                ₹{totalOrdersValue.toLocaleString()}
                            </div>
                            <p className="text-sm text-blue-200">Across {orders.length} orders</p>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column - Khatabook & Orders */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Khatabook Summary Grid */}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Financial Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardBody className="p-5">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-semibold text-gray-500">Total Credit Given</p>
                                    <DollarSign className="w-5 h-5 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{kbTotalCredit.toLocaleString()}</p>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody className="p-5">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-semibold text-gray-500">Total Paid Back</p>
                                    <TrendingUp className="w-5 h-5 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{kbTotalPaid.toLocaleString()}</p>
                            </CardBody>
                        </Card>

                        <Card>
                            <CardBody className="p-5">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-semibold text-gray-500">Currently Pending</p>
                                    <TrendingDown className="w-5 h-5 text-red-500" />
                                </div>
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{kbTotalPending.toLocaleString()}</p>
                            </CardBody>
                        </Card>
                    </div>

                    {/* Latest Orders */}
                    <Card>
                        <CardHeader className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
                            <Link href="/admin/orders">
                                <Button variant="outline" size="sm">Go to Orders</Button>
                            </Link>
                        </CardHeader>
                        <CardBody className="p-0">
                            {orders.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {orders.slice(0, 5).map(order => (
                                        <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">Order #{order.id.slice(0, 8)}</p>
                                                    <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 dark:text-white">₹{order.total_amount}</p>
                                                <p className={`text-xs capitalize font-medium
                                                    ${order.order_status === 'delivered' ? 'text-green-500' : 'text-blue-500'}
                                                `}>
                                                    {order.order_status}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    This customer hasn't placed any orders yet.
                                </div>
                            )}
                        </CardBody>
                    </Card>

                </div>
            </div>
        </div>
    );
}
