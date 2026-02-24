'use client';

import { useState, useEffect } from 'react';
import { Plus, X, FileText, Search, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { generateInvoicePDF, uploadInvoiceToSupabase, InvoiceData } from '@/lib/invoice';
import Modal from '@/components/ui/Modal';
import Script from 'next/script';

interface Product {
    id: string;
    name: string;
    price: number;
    stock_quantity: number;
}

interface CartItem extends Product {
    quantity: number;
}

export default function OfflineBillPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);

    // Form State
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [walkInName, setWalkInName] = useState('');
    const [walkInPhone, setWalkInPhone] = useState('');
    const [discount, setDiscount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCustomers();
        fetchProducts();
    }, []);

    async function fetchCustomers() {
        const { data } = await supabase
            .from('users')
            .select('id, email, full_name, phone')
            .eq('role', 'customer')
            .order('created_at', { ascending: false });
        if (data) setCustomers(data);
    }

    async function fetchProducts() {
        const { data } = await supabase
            .from('spare_parts')
            .select('id, name, price, stock_quantity')
            .gt('stock_quantity', 0)
            .order('name');
        if (data) setProducts(data);
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (product: Product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock_quantity) {
                toast.error('Not enough stock available');
                return;
            }
            setCart(cart.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                if (newQty < 1) return item;
                if (newQty > item.stock_quantity) {
                    toast.error('Exceeds available stock');
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter(item => item.id !== id));
    };

    // Calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gstAmount = Number(((subtotal - discount) * 0.18).toFixed(2)); // Assuming 18% GST on discounted price
    const totalAmount = Number((subtotal - discount + gstAmount).toFixed(2));


    const handleInitialSubmit = (e?: React.MouseEvent) => {
        if (e && e.preventDefault) e.preventDefault();

        if (cart.length === 0) {
            toast.error('Add items to the bill first');
            return;
        }
        if (selectedCustomer === 'walk-in' && !walkInName) {
            toast.error('Please provide a name for walk-in customer');
            return;
        }
        if (!selectedCustomer) {
            toast.error('Please select a customer type');
            return;
        }
        if (!paymentMethod) {
            toast.error('Please select a payment method');
            return;
        }
        setIsModalOpen(true);
    };

    const processOrder = async (isRazorpayVerified = false, orderIdFromDB = null) => {
        setIsSubmitting(true);
        try {
            let customerId = selectedCustomer === 'walk-in' ? null : selectedCustomer;
            let customerName = walkInName;
            let customerEmail = '';
            let customerPhone = walkInPhone;

            if (customerId) {
                const customer = customers.find(c => c.id === customerId);
                if (customer) {
                    customerName = customer.full_name || 'Customer';
                    customerEmail = customer.email;
                    customerPhone = customer.phone || '';
                }
            }

            const paymentStatus = (paymentMethod === 'cash' || paymentMethod === 'upi' || isRazorpayVerified) ? 'paid' : 'pending';

            const invoiceNumber = `OFF-${Date.now().toString().slice(-6)}`;

            const invoiceData: InvoiceData = {
                invoiceNumber,
                orderId: invoiceNumber,
                date: new Date(),
                customerName,
                customerEmail,
                customerPhone,
                items: cart.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    total: item.price * item.quantity
                })),
                subtotal,
                gstAmount,
                discount,
                totalAmount,
                paymentMethod: paymentMethod, // Now correctly lowercase (cash, upi, cod, etc)
                paymentStatus: paymentStatus
            };

            const pdfBytes = await generateInvoicePDF(invoiceData);
            const invoiceUrl = await uploadInvoiceToSupabase(pdfBytes, invoiceNumber);

            console.log("Submitting order with paymentMethod:", paymentMethod, "and paymentStatus:", paymentStatus);

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: customerId,
                    total_amount: totalAmount,
                    payment_status: paymentStatus,
                    order_status: 'confirmed',
                    payment_method: paymentMethod,
                    invoice_url: invoiceUrl,
                    gst_amount: gstAmount,
                    discount: discount
                })
                .select()
                .single();

            if (orderError) {
                console.error("Supabase Order Insert Error:", orderError);
                throw new Error(orderError.message || "Failed to save order to database.");
            }

            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                spare_part_id: item.id,
                quantity: item.quantity,
                price: item.price
            }));

            const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
            if (itemsError) throw itemsError;

            for (const item of cart) {
                let { error: rpcError } = await supabase.rpc('decrement_stock', {
                    product_id: item.id,
                    qty: item.quantity
                });

                if (rpcError) {
                    await supabase.from('spare_parts')
                        .update({ stock_quantity: item.stock_quantity - item.quantity })
                        .eq('id', item.id);
                }
            }

            if (paymentMethod === 'credit' && customerId) {
                const { error: kbError } = await supabase.from('khatabook').insert({
                    customer_id: customerId,
                    order_id: orderData.id,
                    total_amount: totalAmount,
                    amount_pending: totalAmount,
                    amount_paid: 0,
                    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    status: 'pending'
                });
                if (kbError) console.error("Khatabook error:", kbError);
            }

            toast.success('Bill generated successfully!');
            window.open(invoiceUrl, '_blank');

            setCart([]);
            setSelectedCustomer('');
            setWalkInName('');
            setWalkInPhone('');
            setDiscount(0);
            setPaymentMethod('');
            fetchProducts();
            setIsModalOpen(false);

        } catch (error: any) {
            console.error('Billing error:', error);
            toast.error(error.message || 'Failed to generate bill');
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmCreateBill = async () => {
        setIsModalOpen(false);
        setIsSubmitting(true);

        if (paymentMethod === 'razorpay') {
            try {
                const response = await fetch('/api/create-offline-razorpay-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: totalAmount }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Failed to create Razorpay token');

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
                    amount: data.razorpay_order.amount,
                    currency: data.razorpay_order.currency,
                    name: 'Car Spare Parts',
                    description: 'Offline Purchase',
                    order_id: data.razorpay_order.id,
                    handler: async function (res: any) {
                        try {
                            const verifyRes = await fetch('/api/verify-offline-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: res.razorpay_order_id,
                                    razorpay_payment_id: res.razorpay_payment_id,
                                    razorpay_signature: res.razorpay_signature,
                                }),
                            });

                            if (verifyRes.ok) {
                                await processOrder(true);
                            } else {
                                throw new Error('Payment verification failed');
                            }
                        } catch (err: any) {
                            toast.error(err.message || 'Payment Verification Failed');
                            setIsSubmitting(false);
                        }
                    },
                    prefill: {
                        email: selectedCustomer === 'walk-in' ? 'walkin@example.com' : 'admin@domain.com',
                        contact: walkInPhone || '',
                    },
                    theme: { color: '#3b82f6' },
                    modal: {
                        ondismiss: function () {
                            setIsSubmitting(false);
                        }
                    }
                };

                const razorpay = new window.Razorpay(options);
                razorpay.on('payment.failed', function () {
                    toast.error('Payment failed.');
                    setIsSubmitting(false);
                });

                razorpay.open();

            } catch (err: any) {
                console.error("Razorpay init error:", err);
                toast.error(err.message || 'Failed to initialize Razorpay UI');
                setIsSubmitting(false);
            }
        } else {
            await processOrder(false);
        }
    };



    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6 md:mb-8">
                Offline Billing
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left Column: Product Selection */}
                <Card className="h-[600px] flex flex-col">
                    <CardBody className="p-4 flex flex-col h-full">
                        <h2 className="text-xl font-bold mb-4">Select Products</h2>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 w-full"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {filteredProducts.map(product => (
                                <div
                                    key={product.id}
                                    className="flex justify-between items-center p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-300 transition-colors"
                                >
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{product.name}</h3>
                                        <p className="text-sm text-gray-500">Stock: {product.stock_quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <span className="font-bold text-green-600">₹{product.price.toFixed(2)}</span>
                                        <Button
                                            size="sm"
                                            onClick={() => addToCart(product)}
                                            disabled={product.stock_quantity <= 0}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    No products found matching "{searchTerm}"
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

                {/* Right Column: Cart & Billing Details */}
                <Card className="flex flex-col h-auto lg:min-h-[600px]">
                    <CardBody className="p-4 flex flex-col h-full bg-gray-50 dark:bg-gray-800/50">
                        <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                            <span>Current Bill</span>
                            <span className="text-sm font-normal text-gray-500">{cart.length} items</span>
                        </h2>

                        {/* Customer Selection */}
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-4">
                            <select
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                                className="w-full px-4 py-2 mb-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                required
                            >
                                <option value="">-- Select Customer --</option>
                                <option value="walk-in font-bold">🛒 Walk-in Customer</option>
                                <optgroup label="Registered Customers">
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.full_name || c.email} {c.phone ? `(${c.phone})` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            </select>

                            {selectedCustomer === 'walk-in' && (
                                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                                    <Input
                                        placeholder="Customer Name *"
                                        value={walkInName}
                                        onChange={(e) => setWalkInName(e.target.value)}
                                        required
                                    />
                                    <Input
                                        placeholder="Phone (Optional)"
                                        value={walkInPhone}
                                        onChange={(e) => setWalkInPhone(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="flex-1 overflow-y-auto mb-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[150px]">
                            {cart.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400 p-4 text-center">
                                    Add products from the left to start billing
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {cart.map(item => (
                                        <div key={item.id} className="p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-xs">{item.name}</h4>
                                                <p className="text-xs text-gray-500">₹{item.price.toFixed(2)} / unit</p>
                                            </div>
                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 font-medium">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, -1)}
                                                        className="px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                                    >-</button>
                                                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, 1)}
                                                        className="px-3 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                                                    >+</button>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold w-20 text-right">₹{(item.price * item.quantity).toFixed(2)}</span>
                                                    <button
                                                        onClick={() => removeFromCart(item.id)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bill Summary */}
                        <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] mt-auto">
                            <div className="space-y-2 sm:space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                                    <span>Discount (₹)</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={subtotal}
                                        value={discount === 0 ? '' : discount}
                                        onChange={(e) => setDiscount(Number(e.target.value))}
                                        className="w-24 px-2 py-1 text-right border rounded bg-gray-50 dark:bg-gray-800"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                    <span>GST (18%)</span>
                                    <span className="font-medium">₹{gstAmount.toFixed(2)}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                    <span className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="pt-4 mt-2 mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Payment Method <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    required
                                >
                                    <option value="">-- Select Payment Method --</option>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="razorpay">Razorpay (Online)</option>
                                    <option value="cod">Cash on Delivery (COD)</option>
                                    {selectedCustomer !== 'walk-in' && selectedCustomer !== '' && (
                                        <option value="credit">Credit (Khatabook)</option>
                                    )}
                                </select>
                            </div>

                            <Button
                                onClick={(e) => handleInitialSubmit(e)}
                                disabled={isSubmitting || !selectedCustomer || cart.length === 0 || !paymentMethod}
                                className="w-full mt-4 sm:mt-6 h-12 text-lg shadow-lg relative overflow-hidden group"
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2"><Loader className="w-5 h-5 animate-spin" /> Generating Bill...</span>
                                ) : (
                                    <span className="flex items-center gap-2 relative z-10"><FileText className="w-5 h-5" /> Generate Invoice & Complete</span>
                                )}
                                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            </div>

            {/* Confirmation Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Order Details">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to generate the bill and {paymentMethod === 'credit' ? 'add to Khatabook' : paymentMethod === 'razorpay' ? 'initialize Razorpay flow' : `mark payment as ${paymentMethod}`}?
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Total Items:</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{cart.length}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Payment Method:</span>
                            <span className="font-semibold text-gray-900 dark:text-white uppercase">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-base border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                            <span className="font-bold text-gray-900 dark:text-gray-200">Total Amount:</span>
                            <span className="font-black text-blue-600">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-end mt-6">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={confirmCreateBill} disabled={isSubmitting}>
                            {isSubmitting ? 'Processing...' : 'Confirm Generate'}
                        </Button>
                    </div>
                </div>
            </Modal>

            <Script src="https://checkout.razorpay.com/v1/checkout.js" />
        </div>
    );
}
