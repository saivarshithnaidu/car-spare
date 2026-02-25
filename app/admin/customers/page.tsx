'use client';

import { useEffect, useState } from 'react';
import { Search, Eye, Filter, Loader, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'new' | 'incomplete' | 'recent'>('all');

    useEffect(() => {
        fetchCustomers();
    }, []);

    async function fetchCustomers() {
        setLoading(true);
        try {
            const res = await fetch('/api/users?role=customer');
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to fetch customers', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredCustomers = customers.filter(customer => {
        // Search Filter
        const searchTarget = `${customer.full_name || ''} ${customer.email || ''} ${customer.phone || ''}`.toLowerCase();
        const matchesSearch = searchTarget.includes(searchQuery.toLowerCase());

        // Quick Filters
        let matchesType = true;
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        if (filter === 'new') {
            matchesType = new Date(customer.created_at) > sevenDaysAgo;
        } else if (filter === 'incomplete') {
            matchesType = !customer.profile_completed;
        } else if (filter === 'recent') {
            // Logged in within last 24 hours
            matchesType = customer.last_login && new Date(customer.last_login) > new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }

        return matchesSearch && matchesType;
    });

    return (
        <div className="p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                        Customers
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your registered customers and profiles</p>
                </div>
            </div>

            <Card className="mb-6">
                <CardBody className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Search by name, email or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <div className="flex w-full sm:w-auto overflow-x-auto gap-2 pb-2 sm:pb-0">
                        <Button
                            variant={filter === 'all' ? 'primary' : 'outline'}
                            onClick={() => setFilter('all')}
                            size="sm"
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'new' ? 'primary' : 'outline'}
                            onClick={() => setFilter('new')}
                            size="sm"
                            className="whitespace-nowrap"
                        >
                            New (7 Days)
                        </Button>
                        <Button
                            variant={filter === 'incomplete' ? 'primary' : 'outline'}
                            onClick={() => setFilter('incomplete')}
                            size="sm"
                            className="whitespace-nowrap"
                        >
                            Profile Incomplete
                        </Button>
                        <Button
                            variant={filter === 'recent' ? 'primary' : 'outline'}
                            onClick={() => setFilter('recent')}
                            size="sm"
                            className="whitespace-nowrap"
                        >
                            Recently Logged In
                        </Button>
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardBody>
                    {loading ? (
                        <div className="flex justify-center p-12">
                            <Loader className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="hidden md:table-header-group bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Customer Details</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Location</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Registration Status</th>
                                        <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Last Login</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 flex flex-col md:table-row-group">
                                    {filteredCustomers.map((customer) => (
                                        <tr key={customer.id} className="flex flex-col md:table-row p-4 md:p-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-4 py-2 md:py-3 flex flex-col md:table-cell">
                                                <div className="flex justify-between items-start md:block">
                                                    <span className="font-bold text-gray-500 md:hidden mb-1">Details:</span>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                            {customer.full_name || 'No Name Set'}
                                                            {customer.is_vip && (
                                                                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-[10px] font-bold uppercase tracking-wider">VIP</span>
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{customer.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 md:py-3 text-sm text-gray-600 dark:text-gray-400 flex justify-between md:table-cell">
                                                <span className="font-bold text-gray-500 md:hidden">Contact:</span>
                                                {customer.phone || 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 md:py-3 text-sm text-gray-600 dark:text-gray-400 flex justify-between md:table-cell">
                                                <span className="font-bold text-gray-500 md:hidden">Location:</span>
                                                {customer.district ? `${customer.district}, ${customer.state}` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-2 md:py-3 text-sm flex justify-between md:table-cell">
                                                <span className="font-bold text-gray-500 md:hidden">Status:</span>
                                                <div className="flex flex-col gap-1 items-end md:items-start">
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Joined: {new Date(customer.created_at).toLocaleDateString()}
                                                    </span>
                                                    {customer.profile_completed ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 w-fit">
                                                            Profile Complete
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300 w-fit">
                                                            <AlertCircle className="w-3 h-3 mr-1" />
                                                            Incomplete
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 md:py-3 text-sm text-gray-600 dark:text-gray-400 flex justify-between md:table-cell">
                                                <span className="font-bold text-gray-500 md:hidden">Last Login:</span>
                                                {customer.last_login ? new Date(customer.last_login).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                }) : 'Never'}
                                            </td>
                                            <td className="px-4 py-3 md:py-3 text-center mt-3 md:mt-0 flex justify-end md:table-cell">
                                                <Link href={`/admin/customers/${customer.id}`} className="w-full md:w-auto">
                                                    <Button variant="outline" size="sm" className="inline-flex items-center w-full md:w-auto justify-center">
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Details
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredCustomers.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400">No customers found matching your filters.</p>
                                    <Button variant="outline" className="mt-4" onClick={() => { setSearchQuery(''); setFilter('all'); }}>
                                        Clear Filters
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
