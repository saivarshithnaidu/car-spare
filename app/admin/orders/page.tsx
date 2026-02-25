'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Order } from '@/lib/types';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchOrders();
    }, [filter]);

    async function fetchOrders() {
        try {
            const res = await fetch(`/api/orders?payment_status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error('Failed to fetch orders');
        }
    }

    async function updateOrderStatus(orderId: string, newStatus: string) {
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_status: newStatus })
            });

            if (!res.ok) throw new Error();
            toast.success('Order status updated');
            fetchOrders();
        } catch (error) {
            toast.error('Failed to update order status');
        }
    }

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                Orders Management
            </h1>

            {/* Filters */}
            <div className="mb-6 flex gap-2">
                {['all', 'pending', 'paid', 'failed'].map((f) => (
                    <Button
                        key={f}
                        variant={filter === f ? 'primary' : 'outline'}
                        onClick={() => setFilter(f)}
                        size="sm"
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                ))}
            </div>

            <Card>
                <CardBody className="p-0 sm:p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="hidden md:table-header-group bg-gray-100 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Order ID</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Payment Status</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Order Status</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Date</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 flex flex-col md:table-row-group">
                                {orders.map((order) => (
                                    <tr key={order.id} className="flex flex-col md:table-row p-4 md:p-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-2 md:py-3 text-sm font-medium text-gray-900 dark:text-white flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Order ID:</span>
                                            #{order.id.substring(0, 8)}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm text-gray-700 dark:text-gray-300 flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Customer:</span>
                                            <span className="truncate max-w-[200px]">{order.users?.email || 'N/A'}</span>
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm font-semibold text-gray-900 dark:text-white flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Amount:</span>
                                            ₹{order.total_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm flex justify-between items-center md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Payment:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                                order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                                    'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                }`}>
                                                {order.payment_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm flex justify-between items-center md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Status:</span>
                                            <select
                                                value={order.order_status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className="px-2 py-1 border rounded bg-white dark:bg-gray-800 text-sm max-w-[120px]"
                                            >
                                                <option value="booked">Booked</option>
                                                <option value="confirmed">Confirmed</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm text-gray-700 dark:text-gray-300 flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Date:</span>
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm mt-3 md:mt-0 flex flex-wrap justify-end md:table-cell gap-2">
                                            <Link href={`/admin/orders/${order.id}`} className="w-full md:w-auto">
                                                <Button size="sm" className="w-full md:w-auto">View Order</Button>
                                            </Link>
                                            {order.invoice_url ? (
                                                <a href={order.invoice_url} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto">
                                                    <Button variant="outline" size="sm" className="w-full md:w-auto">View Invoice</Button>
                                                </a>
                                            ) : (
                                                <span className="text-gray-400 text-xs italic">No Invoice</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                            No orders found matching the criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
