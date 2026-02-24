'use client';

import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, AlertTriangle, Users, TrendingUp, UserPlus, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import Link from 'next/link';
import Button from '@/components/ui/Button';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        pendingPayments: 0,
        lowStockCount: 0,
        totalCustomers: 0,
        newCustomers: 0,
        activeToday: 0,
    });

    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
    const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>([]);
    const [paymentStats, setPaymentStats] = useState({ paid: 0, pending: 0, failed: 0 });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    async function fetchDashboardData() {
        // Fetch total sales
        const { data: paidOrders } = await supabase
            .from('orders')
            .select('total_amount')
            .eq('payment_status', 'paid');
        const totalSales = paidOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

        // Fetch total orders
        const { count: totalOrders } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true });

        // Fetch pending payments from khatabook
        const { data: khatabookData } = await supabase
            .from('khatabook')
            .select('pending_amount')
            .eq('status', 'pending');
        const pendingPayments = khatabookData?.reduce((sum, entry) => sum + entry.pending_amount, 0) || 0;

        // Fetch low stock items
        const { count: lowStockCount } = await supabase
            .from('spare_parts')
            .select('*', { count: 'exact', head: true })
            .lt('stock_quantity', 10)
            .gt('stock_quantity', 0);

        // --- NEW CUSTOMER STATS ---
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        // 1. Total Customers
        const { count: totalCustomers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer');

        // 2. New Customers (last 7 days)
        const { count: newCustomers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer')
            .gte('created_at', sevenDaysAgo);

        // 3. Active Today
        const { count: activeToday } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer')
            .gte('last_login', startOfDay);

        setStats({
            totalSales,
            totalOrders: totalOrders || 0,
            pendingPayments,
            lowStockCount: lowStockCount || 0,
            totalCustomers: totalCustomers || 0,
            newCustomers: newCustomers || 0,
            activeToday: activeToday || 0,
        });

        // Fetch recent orders
        const { data: orders } = await supabase
            .from('orders')
            .select('*, users(email)')
            .order('created_at', { ascending: false })
            .limit(5);
        setRecentOrders(orders || []);

        // Fetch recent customers
        const { data: customers } = await supabase
            .from('users')
            .select('id, full_name, email, created_at')
            .eq('role', 'customer')
            .order('created_at', { ascending: false })
            .limit(5);
        setRecentCustomers(customers || []);

        // Payment status stats
        const { data: allOrders } = await supabase.from('orders').select('payment_status');
        const paid = allOrders?.filter(o => o.payment_status === 'paid').length || 0;
        const pending = allOrders?.filter(o => o.payment_status === 'pending').length || 0;
        const failed = allOrders?.filter(o => o.payment_status === 'failed').length || 0;
        setPaymentStats({ paid, pending, failed });

        // Monthly revenue (mock for now)
        const monthlyData = [12000, 19000, 15000, 25000, 22000, 30000];
        setMonthlyRevenue(monthlyData);
    }

    const monthlyRevenueChart = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Revenue (₹)',
            data: monthlyRevenue,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.4,
        }],
    };

    const paymentStatsChart = {
        labels: ['Paid', 'Pending', 'Failed'],
        datasets: [{
            data: [paymentStats.paid, paymentStats.pending, paymentStats.failed],
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        }],
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
            </h1>

            {/* Financial & Inventory Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Sales</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">₹{stats.totalSales.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <DollarSign className="w-6 h-6" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Pending Khatabook</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">₹{stats.pendingPayments.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalOrders}</p>
                            </div>
                            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <ShoppingBag className="w-6 h-6" />
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardBody>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Low Stock</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.lowStockCount}</p>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Customer Stats Section */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">Customer Intelligence</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardBody className="flex items-center p-6">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 mr-4">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Customers</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center p-6">
                        <div className="p-4 bg-teal-50 dark:bg-teal-900/30 rounded-full text-teal-600 dark:text-teal-400 mr-4">
                            <UserPlus className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">New This Week</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.newCustomers}</p>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody className="flex items-center p-6">
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400 mr-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Active Today</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeToday}</p>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Revenue</h2>
                    </CardHeader>
                    <CardBody>
                        <Line data={monthlyRevenueChart} options={{ responsive: true, maintainAspectRatio: true }} />
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Distribution</h2>
                    </CardHeader>
                    <CardBody>
                        <div className="h-64 flex items-center justify-center">
                            <Pie data={paymentStatsChart} options={{ responsive: true, maintainAspectRatio: true }} />
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Two Column Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                {/* Recent Orders List */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Orders</h2>
                        <Link href="/admin/orders"><Button variant="outline" size="sm">View All</Button></Link>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recentOrders.map((order) => (
                                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">#{order.id.substring(0, 8)}</p>
                                        <p className="text-sm text-gray-500">{order.users?.email || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">₹{order.total_amount.toFixed(2)}</p>
                                        <span className={`text-xs px-2 py-0.5 mt-1 rounded-full font-medium inline-block
                                            ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'}`}>
                                            {order.payment_status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {recentOrders.length === 0 && <div className="p-6 text-center text-gray-500">No recent orders</div>}
                        </div>
                    </CardBody>
                </Card>

                {/* Recently Registered Customers */}
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Customers</h2>
                        <Link href="/admin/customers"><Button variant="outline" size="sm">Manage Users</Button></Link>
                    </CardHeader>
                    <CardBody className="p-0">
                        <div className="divide-y divide-gray-100 dark:divide-gray-800">
                            {recentCustomers.map((customer) => (
                                <div key={customer.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold uppercase">
                                            {(customer.full_name || customer.email || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">{customer.full_name || 'Unnamed User'}</p>
                                            <p className="text-sm text-gray-500">{customer.email}</p>
                                        </div>
                                    </div>
                                    <div className="text-right text-sm text-gray-500">
                                        {new Date(customer.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                            {recentCustomers.length === 0 && <div className="p-6 text-center text-gray-500">No recent registrations</div>}
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
