import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { generateInvoicePDF } from '@/lib/invoice-generator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Verify Razorpay signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // Get order details
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .select('*, order_items(*, spare_part:spare_parts(*))')
            .eq('id', order_id)
            .single();

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Get user email
        const { data: userData } = await supabaseAdmin
            .from('users')
            .select('email')
            .eq('id', order.user_id)
            .single();

        // Update order status
        await supabaseAdmin
            .from('orders')
            .update({
                payment_status: 'paid',
                order_status: 'confirmed',
                razorpay_payment_id,
            })
            .eq('id', order_id);

        // Reduce stock quantities
        for (const item of order.order_items) {
            await supabaseAdmin
                .from('spare_parts')
                .update({
                    stock_quantity: item.spare_part.stock_quantity - item.quantity,
                })
                .eq('id', item.spare_part_id);
        }

        // Generate invoice PDF
        const invoicePDF = await generateInvoicePDF(
            order,
            order.order_items,
            userData?.email || 'customer@example.com'
        );

        // Upload invoice to Supabase Storage
        const invoiceFileName = `${order.user_id}/${order_id}.pdf`;
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from('invoices')
            .upload(invoiceFileName, invoicePDF, {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (uploadError) {
            console.error('Invoice upload error:', uploadError);
        }

        // Get public URL for invoice
        const { data: urlData } = supabaseAdmin.storage
            .from('invoices')
            .getPublicUrl(invoiceFileName);

        // Update order with invoice URL
        await supabaseAdmin
            .from('orders')
            .update({ invoice_url: urlData.publicUrl })
            .eq('id', order_id);

        return NextResponse.json({
            success: true,
            message: 'Payment verified successfully',
            invoice_url: urlData.publicUrl,
        });
    } catch (error: any) {
        console.error('Payment verification error:', error);
        return NextResponse.json(
            { error: error.message || 'Payment verification failed' },
            { status: 500 }
        );
    }
}
