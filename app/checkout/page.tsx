'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader, Banknote, Truck, Smartphone } from 'lucide-react';
import { getCart, calculateCartTotal, clearCart } from '@/lib/cart';
import { CartItem } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import Card, { CardBody, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { generateInvoicePDF, uploadInvoiceToSupabase, InvoiceData } from '@/lib/invoice';

declare global {
    interface Window {
        Razorpay: any;
    }
}

type PaymentMethod = 'razorpay' | 'cod' | 'pod';

export default function CheckoutPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totals, setTotals] = useState({ subtotal: 0, gst: 0, total: 0 });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');

    useEffect(() => {
        checkAuth();
        loadCart();
        loadRazorpayScript();
    }, []);

    async function checkAuth() {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            toast.error('Please login to proceed');
            router.push('/login');
            return;
        }

        const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        setUser(userData);
    }

    function loadCart() {
        const items = getCart();
        if (items.length === 0) {
            router.push('/cart');
            return;
        }
        setCartItems(items);
        setTotals(calculateCartTotal(items));
    }

    function loadRazorpayScript() {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }

    async function handlePlaceOrder() {
        if (!user) {
            toast.error('Please login first');
            return;
        }

        if (paymentMethod === 'razorpay') {
            handleRazorpayPayment();
        } else {
            handleCODOrder();
        }
    }

    async function handleCODOrder() {
        setLoading(true);

        try {
            // Create order with COD/POD
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) throw new Error('Not authenticated');

            const resOrder = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: authUser.id,
                    total_amount: totals.total,
                    payment_status: 'pending',
                    payment_method: paymentMethod,
                    order_status: 'booked',
                    gst_amount: totals.gst,
                    discount: 0
                })
            });
            if (!resOrder.ok) throw new Error('Failed to create order');
            const order = await resOrder.json();

            // Generate Invoice
            const invoiceNumber = `ORD-${order.id.split('-')[0].toUpperCase()}`;
            const invoiceData: InvoiceData = {
                invoiceNumber,
                orderId: order.id,
                date: new Date(),
                customerName: user.full_name || user.email,
                customerEmail: user.email,
                customerPhone: user.phone || '',
                items: cartItems.map(item => ({
                    name: item.spare_part.name,
                    price: item.spare_part.price,
                    quantity: item.quantity,
                    total: item.spare_part.price * item.quantity
                })),
                subtotal: totals.subtotal,
                gstAmount: totals.gst,
                discount: 0,
                totalAmount: totals.total,
                paymentMethod: paymentMethod,
                paymentStatus: 'pending'
            };

            const pdfBytes = await generateInvoicePDF(invoiceData);
            const invoiceUrl = await uploadInvoiceToSupabase(pdfBytes, invoiceNumber);

            // Update order with invoice URL
            const resUpdate = await fetch(`/api/orders/${order.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ invoice_url: invoiceUrl })
            });
            if (!resUpdate.ok) throw new Error('Failed to update order invoice');

            // Insert order items
            const orderItems = cartItems.map(item => ({
                order_id: order.id,
                spare_part_id: item.spare_part.id,
                quantity: item.quantity,
                price: item.spare_part.price,
            }));

            const resItems = await fetch('/api/order-items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderItems)
            });
            if (!resItems.ok) throw new Error('Failed to insert order items');

            // Reduce stock quantities
            for (const item of cartItems) {
                await fetch(`/api/products/${item.spare_part.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        stock_quantity: item.spare_part.stock_quantity - item.quantity
                    })
                });
            }

            clearCart();
            window.dispatchEvent(new Event('cartUpdated'));

            const methodText = paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pay on Delivery';
            toast.success(`Order placed successfully with ${methodText}!`);
            router.push('/orders');
        } catch (error: any) {
            console.error('Order error:', error);
            toast.error(error.message || 'Failed to place order');
        } finally {
            setLoading(false);
        }
    }

    async function handleRazorpayPayment() {
        setLoading(true);

        try {
            // Create order
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totals.total,
                    cart_items: cartItems.map(item => ({
                        spare_part_id: item.spare_part.id,
                        quantity: item.quantity,
                        price: item.spare_part.price,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create order');
            }

            // Open Razorpay checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY!,
                amount: data.razorpay_order.amount,
                currency: data.razorpay_order.currency,
                name: 'Car Spare Parts',
                description: 'Spare Parts Purchase',
                order_id: data.razorpay_order.id,
                handler: async function (response: any) {
                    await verifyPayment(response, data.order_id);
                },
                prefill: {
                    email: user.email,
                    contact: user.phone || '',
                },
                theme: {
                    color: '#3b82f6',
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                toast.error('Payment failed. Please try again.');
                setLoading(false);
            });

            razorpay.open();
            setLoading(false);
        } catch (error: any) {
            console.error('Payment error:', error);
            toast.error(error.message || 'Failed to initialize payment');
            setLoading(false);
        }
    }

    async function verifyPayment(paymentResponse: any, orderId: string) {
        try {
            const response = await fetch('/api/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    razorpay_order_id: paymentResponse.razorpay_order_id,
                    razorpay_payment_id: paymentResponse.razorpay_payment_id,
                    razorpay_signature: paymentResponse.razorpay_signature,
                    order_id: orderId,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Generate Invoice on Success
                const invoiceNumber = `ONL-${orderId.split('-')[0].toUpperCase()}`;
                const invoiceData: InvoiceData = {
                    invoiceNumber,
                    orderId: orderId,
                    date: new Date(),
                    customerName: user.full_name || user.email,
                    customerEmail: user.email,
                    customerPhone: user.phone || '',
                    items: cartItems.map(item => ({
                        name: item.spare_part.name,
                        price: item.spare_part.price,
                        quantity: item.quantity,
                        total: item.spare_part.price * item.quantity
                    })),
                    subtotal: totals.subtotal,
                    gstAmount: totals.gst,
                    discount: 0,
                    totalAmount: totals.total,
                    paymentMethod: 'online/razorpay',
                    paymentStatus: 'paid'
                };

                const pdfBytes = await generateInvoicePDF(invoiceData);
                const invoiceUrl = await uploadInvoiceToSupabase(pdfBytes, invoiceNumber);

                // Update order with invoice URL
                await fetch(`/api/orders/${orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoice_url: invoiceUrl })
                });

                clearCart();
                window.dispatchEvent(new Event('cartUpdated'));
                toast.success('Payment successful! Order placed.');
                router.push('/orders');
            } else {
                throw new Error(data.error || 'Payment verification failed');
            }
        } catch (error: any) {
            console.error('Verification error:', error);
            toast.error(error.message || 'Payment verification failed');
        }
    }

    if (!user || cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    Checkout
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Order Summary */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Order Summary
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-3">
                                {cartItems.map((item) => (
                                    <div key={item.spare_part.id} className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {item.spare_part.name} x {item.quantity}
                                        </span>
                                        <span className="font-semibold text-gray-900 dark:text-white">
                                            ₹{(item.spare_part.price * item.quantity).toFixed(2)}
                                        </span>
                                    </div>
                                ))}

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>Subtotal:</span>
                                        <span>₹{totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>GST (18%):</span>
                                        <span>₹{totals.gst.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                                        <span>Total:</span>
                                        <span className="text-blue-600 dark:text-blue-400">
                                            ₹{totals.total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Payment Method */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Payment Method
                            </h2>
                        </CardHeader>
                        <CardBody>
                            <div className="space-y-4">
                                {/* Razorpay Option */}
                                <button
                                    onClick={() => setPaymentMethod('razorpay')}
                                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'razorpay'
                                        ? 'border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400 mr-3" />
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                Pay Online (UPI/Card/Wallet)
                                            </span>
                                        </div>
                                        {paymentMethod === 'razorpay' && (
                                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Secure payment via UPI, Cards, Net Banking, and Wallets
                                    </p>
                                </button>

                                {/* Cash on Delivery */}
                                <button
                                    onClick={() => setPaymentMethod('cod')}
                                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'cod'
                                        ? 'border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <Banknote className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                Cash on Delivery
                                            </span>
                                        </div>
                                        {paymentMethod === 'cod' && (
                                            <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Pay with cash when your order arrives
                                    </p>
                                </button>

                                {/* Pay on Delivery */}
                                <button
                                    onClick={() => setPaymentMethod('pod')}
                                    className={`w-full p-4 border-2 rounded-lg text-left transition-all ${paymentMethod === 'pod'
                                        ? 'border-orange-600 dark:border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <Truck className="w-6 h-6 text-orange-600 dark:text-orange-400 mr-3" />
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                Pay on Delivery
                                            </span>
                                        </div>
                                        {paymentMethod === 'pod' && (
                                            <div className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-white rounded-full" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Pay via UPI/Card when your order is delivered
                                    </p>
                                </button>

                                {/* Place Order Button */}
                                <Button
                                    size="lg"
                                    className="w-full mt-4"
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            {paymentMethod === 'razorpay' ? (
                                                <>
                                                    <CreditCard className="w-5 h-5 mr-2" />
                                                    Pay ₹{totals.total.toFixed(2)}
                                                </>
                                            ) : (
                                                <>
                                                    <Truck className="w-5 h-5 mr-2" />
                                                    Place Order - ₹{totals.total.toFixed(2)}
                                                </>
                                            )}
                                        </>
                                    )}
                                </Button>

                                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                    {paymentMethod === 'razorpay'
                                        ? 'Your payment information is secure and encrypted'
                                        : 'No advance payment required - pay when you receive'
                                    }
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
}
