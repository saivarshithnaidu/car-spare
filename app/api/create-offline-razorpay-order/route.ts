import { NextRequest, NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { amount } = body;

        if (!amount || isNaN(amount)) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Create Razorpay order without database side-effects
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            receipt: `offline_${Date.now()}`,
        });

        return NextResponse.json({
            razorpay_order: razorpayOrder
        });
    } catch (error: any) {
        console.error('Create offline Razorpay order error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
