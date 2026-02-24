import fs from 'fs';

let content = fs.readFileSync('app/admin/offline-bill/page.tsx', 'utf8');

// 1. Add Imports
content = content.replace(
    "import { generateInvoicePDF, uploadInvoiceToSupabase, InvoiceData } from '@/lib/invoice';",
    "import { generateInvoicePDF, uploadInvoiceToSupabase, InvoiceData } from '@/lib/invoice';\nimport Modal from '@/components/ui/Modal';\nimport Script from 'next/script';"
);

// 2. Add State
content = content.replace(
    "const [isSubmitting, setIsSubmitting] = useState(false);",
    "const [paymentMethod, setPaymentMethod] = useState('');\n    const [isModalOpen, setIsModalOpen] = useState(false);\n    const [isSubmitting, setIsSubmitting] = useState(false);"
);

// 3. Replace handleCreateBill completely
const handleCreateBillStart = content.indexOf('const handleCreateBill = async () => {');
const returnDivStart = content.indexOf('return (', handleCreateBillStart);
const handleCreateBillEnd = content.lastIndexOf('};', returnDivStart) + 2;

// The new functions:
const newFunctions = `
    const handleInitialSubmit = () => {
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

            const invoiceNumber = \`OFF-\${Date.now().toString().slice(-6)}\`;
            
            const invoiceData = {
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
                paymentMethod: paymentMethod,
                paymentStatus: paymentStatus
            };

            const pdfBytes = await generateInvoicePDF(invoiceData);
            const invoiceUrl = await uploadInvoiceToSupabase(pdfBytes, invoiceNumber);

            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: customerId,
                    total_amount: totalAmount,
                    payment_status: paymentStatus,
                    order_status: 'delivered',
                    payment_method: paymentMethod,
                    invoice_url: invoiceUrl,
                    gst_amount: gstAmount,
                    discount: discount
                })
                .select()
                .single();

            if (orderError) throw orderError;

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

        } catch (error) {
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
                    handler: async function (res) {
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
                        } catch (err) {
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
                        ondismiss: function() {
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
                
            } catch (err) {
                console.error("Razorpay init error:", err);
                toast.error(err.message || 'Failed to initialize Razorpay UI');
                setIsSubmitting(false);
            }
        } else {
            await processOrder(false);
        }
    };`;

content = content.substring(0, handleCreateBillStart) + newFunctions + "\n\n" + content.substring(handleCreateBillEnd);

// 4. Update the UI
// Find "Bill Summary" and the Generate Button
const totalAmountDiv = '<span className="text-2xl font-black text-blue-600 dark:text-blue-400">₹{totalAmount.toFixed(2)}</span>\n                                </div>\n                            </div>';

const uiHtml = `
                                <div className="pt-4 mt-2">
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
`;

content = content.replace(
    totalAmountDiv,
    totalAmountDiv + "\n" + uiHtml
);

content = content.replace(
    /onClick=\{handleCreateBill\}/g,
    'onClick={handleInitialSubmit}'
);

content = content.replace(
    /disabled=\{isSubmitting \|\| cart\.length === 0\}/g,
    'disabled={isSubmitting || cart.length === 0 || !paymentMethod}'
);

const modalHtml = `

            {/* Confirmation Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Confirm Order details">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300">
                        Are you sure you want to generate the bill and {paymentMethod === 'credit' ? 'add to Khatabook' : paymentMethod === 'razorpay' ? 'initialize Razorpay flow' : \`mark payment as \${paymentMethod}\`}?
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
`;

content = content.replace(
    '        </div>\n    );\n}',
    modalHtml + '    );\n}'
);

fs.writeFileSync('app/admin/offline-bill/page.tsx', content);
console.log('done');
