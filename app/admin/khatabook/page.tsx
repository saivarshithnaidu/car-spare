'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Loader, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminKhatabookPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [paidAmount, setPaidAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    const pendingAmount = Math.max(0, Number(totalAmount || 0) - Number(paidAmount || 0));

    useEffect(() => {
        fetchKhatabookEntries();
        fetchCustomers();
    }, []);

    async function fetchKhatabookEntries() {
        try {
            const res = await fetch('/api/khatabook');
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (error) {
            console.error('Failed to fetch khatabook entries', error);
        }
    }

    async function fetchCustomers() {
        try {
            const res = await fetch('/api/users?role=customer');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    }

    async function handleAddEntry(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedCustomer) {
            toast.error('Please select a customer');
            return;
        }
        if (Number(totalAmount) <= 0) {
            toast.error('Total amount must be greater than 0');
            return;
        }

        setIsSubmitting(true);
        const status = pendingAmount === 0 ? 'paid' : (new Date(dueDate) < new Date() ? 'overdue' : 'pending');

        try {
            const res = await fetch('/api/khatabook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: selectedCustomer,
                    total_amount: Number(totalAmount),
                    paid_amount: Number(paidAmount),
                    pending_amount: pendingAmount,
                    due_date: dueDate || null,
                    status: status,
                    notes: notes
                })
            });

            if (!res.ok) throw new Error('Failed to add entry');

            toast.success('Khatabook entry added successfully!');
            setIsModalOpen(false);

            // Reset form
            setSelectedCustomer('');
            setTotalAmount('');
            setPaidAmount('');
            setDueDate('');
            setNotes('');

            fetchKhatabookEntries();
        } catch (error: any) {
            console.error('Error adding entry:', error);
            toast.error(error.message || 'Failed to add entry');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function markAsPaid(id: string) {
        try {
            const res = await fetch(`/api/khatabook/${id}?action=mark-paid`, { method: 'PUT' });
            if (!res.ok) throw new Error('Failed to update status');

            toast.success('Marked as paid');
            fetchKhatabookEntries();
        } catch (error) {
            toast.error('Failed to update status');
            console.error(error);
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                        Khatabook Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage customer credits and payments</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Entry
                </Button>
            </div>

            <Card>
                <CardBody>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="hidden md:table-header-group bg-gray-100 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Customer</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Contact</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Total Amt</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Paid</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Pending</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 flex flex-col md:table-row-group">
                                {entries.map((entry) => (
                                    <tr key={entry.id} className="flex flex-col md:table-row p-4 md:p-0 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                        <td className="px-4 py-2 md:py-3 text-sm text-gray-900 dark:text-white font-medium flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Customer:</span>
                                            <span className="truncate max-w-[200px]">{entry.users?.full_name || entry.users?.email || 'N/A'}</span>
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm text-gray-500 dark:text-gray-400 flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Contact:</span>
                                            {entry.users?.phone || 'No phone'}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm font-semibold flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Total Amt:</span>
                                            ₹{entry.total_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm text-green-600 flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Paid:</span>
                                            ₹{entry.paid_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm text-red-600 font-semibold flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Pending:</span>
                                            ₹{entry.pending_amount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Due Date:</span>
                                            {entry.due_date ? new Date(entry.due_date).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Status:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${entry.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                                entry.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                }`}>
                                                {entry.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 md:py-3 text-sm mt-3 md:mt-0 flex justify-end md:table-cell">
                                            <div className="flex items-center justify-end md:justify-center space-x-2 w-full md:w-auto">
                                                <Link href={`/admin/customers/${entry.user_id}`} className="flex-1 md:flex-none">
                                                    <Button variant="outline" size="sm" title="View Customer" className="w-full md:w-auto p-2 flex justify-center">
                                                        <Eye className="w-4 h-4 mr-1 md:mr-0" />
                                                        <span className="md:hidden">View</span>
                                                    </Button>
                                                </Link>
                                                {entry.status !== 'paid' && (
                                                    <Button size="sm" onClick={() => markAsPaid(entry.id)} className="flex-1 md:flex-none">
                                                        Mark Paid
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {entries.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                No khatabook entries found
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Add Entry Modal window */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <Card className="w-full max-w-lg bg-white dark:bg-gray-900 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-800">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Khatabook Entry</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <CardBody className="p-6">
                            <form onSubmit={handleAddEntry} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Select Customer
                                    </label>
                                    <select
                                        value={selectedCustomer}
                                        onChange={(e) => setSelectedCustomer(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                        required
                                    >
                                        <option value="">-- Choose a Customer --</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.full_name || 'Unknown'} ({c.email}) {c.phone ? `- ${c.phone}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        label="Total Amount (₹)"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={totalAmount}
                                        onChange={(e) => setTotalAmount(e.target.value)}
                                        required
                                    />
                                    <Input
                                        label="Paid Amount (₹)"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={paidAmount}
                                        onChange={(e) => setPaidAmount(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">
                                            Pending Amount
                                        </label>
                                        <div className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-red-600 font-semibold border border-transparent">
                                            ₹{pendingAmount.toFixed(2)}
                                        </div>
                                    </div>
                                    <Input
                                        label="Due Date"
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Notes (Optional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none min-h-[80px]"
                                        placeholder="Add any relevant notes here..."
                                    />
                                </div>

                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                                    <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : null}
                                        Add Record
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
}
