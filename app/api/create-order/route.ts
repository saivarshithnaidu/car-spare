import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        // Get current user
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { amount, cart_items } = body;

        if (!amount || !cart_items || cart_items.length === 0) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `order_${Date.now()}`,
        });

        // Create order in database
        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert({
                user_id: user.id,
                total_amount: amount,
                payment_status: 'pending',
                order_status: 'booked',
                razorpay_order_id: razorpayOrder.id,
            })
            .select()
            .single();

        if (orderError) {
            console.error('Order creation error:', orderError);
            return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
        }

        // Create order items
        const orderItems = cart_items.map((item: any) => ({
            order_id: order.id,
            spare_part_id: item.spare_part_id,
            quantity: item.quantity,
            price: item.price,
        }));

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items error:', itemsError);
            // Rollback order
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 });
        }

        return NextResponse.json({
            razorpay_order: razorpayOrder,
            order_id: order.id,
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
