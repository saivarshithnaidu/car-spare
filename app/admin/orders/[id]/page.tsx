'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { FileText, ArrowLeft, Loader, Package, MapPin, CreditCard, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { generateInvoicePDF, uploadInvoiceToSupabase, InvoiceData } from '@/lib/invoice';

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [statusLoading, setStatusLoading] = useState(false);
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    // Unwrapping promise to fix Next.js 15+ async params
    const resolvedParams = use(params);
    const orderId = resolvedParams.id;

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    async function fetchOrderDetails() {
        setLoading(true);
        const { data, error } = await supabase
            .from('orders')
            .select(`
                *,
                users:user_id(email, full_name, phone, address, district, state, pincode),
                order_items(*, spare_part:spare_part_id(*))
            `)
            .eq('id', orderId)
            .single();

        if (error || !data) {
            toast.error('Failed to load order details');
            router.push('/admin/orders');
            return;
        }

        setOrder(data);
        setLoading(false);
    }

    async function updateOrderStatus(newStatus: string) {
        setStatusLoading(true);
        const { error } = await supabase
            .from('orders')
            .update({ order_status: newStatus })
            .eq('id', orderId);

        if (error) {
            toast.error('Failed to update order status');
        } else {
            setOrder({ ...order, order_status: newStatus });
            toast.success('Order status updated successfully');
        }
        setStatusLoading(false);
    }

    async function handleGenerateInvoice() {
        if (!order) return;
        setInvoiceLoading(true);

        try {
            const prefix = order.payment_method === 'offline' ? 'OFF' : 'ONL';
            const invoiceNumber = `INV-${prefix}-${order.id.split('-')[0].toUpperCase()}`;

            const customerName = order.users ? order.users.full_name || order.users.email : 'Guest';
            const customerEmail = order.users ? order.users.email : 'N/A';
            const customerPhone = order.users ? order.users.phone || '' : '';

            const invoiceData: InvoiceData = {
                invoiceNumber,
                orderId: order.id,
                date: new Date(order.created_at),
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                items: order.order_items.map((item: any) => ({
                    name: item.spare_part.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                })),
                subtotal: order.total_amount - (order.gst_amount || 0) + (order.discount || 0),
                gstAmount: order.gst_amount || 0,
                discount: order.discount || 0,
                totalAmount: order.total_amount,
                paymentMethod: order.payment_method || 'unknown',
                paymentStatus: order.payment_status
            };

            const pdfBytes = await generateInvoicePDF(invoiceData);
            const invoiceUrl = await uploadInvoiceToSupabase(pdfBytes, invoiceNumber);

            // Update order with invoice URL
            const { error: updateError } = await supabase
                .from('orders')
                .update({ invoice_url: invoiceUrl })
                .eq('id', order.id);

            if (updateError) throw updateError;

            setOrder({ ...order, invoice_url: invoiceUrl });
            toast.success('Invoice generated successfully');
        } catch (error: any) {
            console.error('Invoice generation failed:', error);
            toast.error('Failed to generate invoice');
        } finally {
            setInvoiceLoading(false);
        }
    }

    if (loading || !order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    // Default calculations if not physically present in older DB entries
    const subtotal = order.total_amount - (order.gst_amount || 0) + (order.discount || 0);

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
            <div className="flex items-center mb-6 gap-3">
                <Link href="/admin/orders">
                    <Button variant="outline" size="sm" className="flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
                </Link>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Order Details
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Order Items & Status */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Status Timeline / Management */}
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-blue-500" />
                                Packing & Status
                            </h2>
                            <span className={`mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-semibold self-start sm:self-auto ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                    order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                }`}>
                                Payment: {order.payment_status.toUpperCase()}
                            </span>
                        </CardHeader>
                        <CardBody>
                            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Update Order Status
                                    </label>
                                    <select
                                        value={order.order_status}
                                        onChange={(e) => updateOrderStatus(e.target.value)}
                                        disabled={statusLoading}
                                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="booked">Booked (New)</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="processing">Processing</option>
                                        <option value="packed">Packed</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                {statusLoading && <Loader className="w-5 h-5 animate-spin text-blue-500 mb-2" />}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Ordered Items List */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Ordered Products
                            </h2>
                        </CardHeader>
                        <CardBody className="p-0 sm:p-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="hidden sm:table-header-group bg-gray-50 dark:bg-gray-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Product</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Price</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300">Qty</th>
                                            <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 flex flex-col sm:table-row-group">
                                        {order.order_items.map((item: any) => (
                                            <tr key={item.id} className="flex flex-col sm:table-row p-4 sm:p-0">
                                                <td className="px-4 py-2 sm:py-4 flex gap-3 items-center">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                                        {item.spare_part?.image_url ? (
                                                            <img src={item.spare_part.image_url} alt="Part" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Package className="w-full h-full p-2 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{item.spare_part?.name || 'Unknown Part'}</p>
                                                        <p className="text-xs text-gray-500 opacity-80">{item.spare_part?.car_model}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-1 sm:py-4 text-sm text-gray-700 dark:text-gray-300 flex justify-between sm:table-cell">
                                                    <span className="sm:hidden font-semibold text-gray-500">Price:</span>
                                                    ₹{item.price.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-1 sm:py-4 text-sm text-gray-700 dark:text-gray-300 flex justify-between sm:table-cell">
                                                    <span className="sm:hidden font-semibold text-gray-500">Qty:</span>
                                                    x{item.quantity}
                                                </td>
                                                <td className="px-4 py-1 sm:py-4 text-sm font-bold text-gray-900 dark:text-white sm:text-right flex justify-between sm:table-cell">
                                                    <span className="sm:hidden font-semibold text-gray-500">Total:</span>
                                                    ₹{(item.price * item.quantity).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer */}
                            <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2 px-4 sm:px-0">
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Subtotal:</span>
                                    <span>₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>Discount:</span>
                                    <span>-₹{(order.discount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>GST (18%):</span>
                                    <span>+₹{(order.gst_amount || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
                                    <span>Grand Total:</span>
                                    <span>₹{order.total_amount.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Right Column - User & Document Info */}
                <div className="space-y-6">
                    {/* Invoice Card */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-500" />
                                Invoice & Payment
                            </h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <CreditCard className="w-4 h-4 mt-0.5 text-gray-400" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Payment Method</p>
                                    <p className="uppercase">{order.payment_method || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <Clock className="w-4 h-4 mt-0.5 text-gray-400" />
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Order Date</p>
                                    <p>{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <hr className="border-gray-100 dark:border-gray-800 my-4" />

                            <div className="space-y-3">
                                {order.invoice_url ? (
                                    <>
                                        <a href={order.invoice_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                                            <Button variant="outline" className="w-full flex justify-center items-center gap-2">
                                                <FileText className="w-4 h-4" /> Download Invoice
                                            </Button>
                                        </a>
                                        <p className="text-xs text-center text-green-600 dark:text-green-400 flex items-center justify-center gap-1">
                                            <CheckCircle className="w-3 h-3" /> Invoice generated successfully
                                        </p>
                                    </>
                                ) : (
                                    <Button
                                        variant="primary"
                                        className="w-full flex justify-center items-center gap-2"
                                        onClick={handleGenerateInvoice}
                                        disabled={invoiceLoading}
                                    >
                                        {invoiceLoading ? (
                                            <><Loader className="w-4 h-4 animate-spin" /> Generating...</>
                                        ) : (
                                            <><FileText className="w-4 h-4" /> Generate Invoice</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>

                    {/* Customer Info Card */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-orange-500" />
                                Customer Details
                            </h2>
                        </CardHeader>
                        <CardBody className="space-y-4">
                            {order.users ? (
                                <>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Details</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{order.users.full_name || 'No Name Provided'}</p>
                                        <p className="text-sm text-blue-600 dark:text-blue-400">{order.users.email}</p>
                                        {order.users.phone && <p className="text-sm text-gray-600 dark:text-gray-300">{order.users.phone}</p>}
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Shipping Address</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {order.users.address ? order.users.address : <span className="text-gray-400 italic">No Address Defined</span>}
                                        </p>
                                        {(order.users.district || order.users.state) && (
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                {order.users.district && `${order.users.district}, `}
                                                {order.users.state} {order.users.pincode ? `- ${order.users.pincode}` : ''}
                                            </p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Walk-in Customer / Details Missing</p>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
