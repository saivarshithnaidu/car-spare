import Razorpay from 'razorpay';

// Server-side only - never expose to client
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Razorpay options for checkout
export function getRazorpayOptions(orderId: string, amount: number, userEmail: string) {
    return {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY!,
        amount: amount * 100, // Convert to paise
        currency: 'INR',
        name: 'Car Spare Parts',
        description: 'Spare Parts Purchase',
        order_id: orderId,
        prefill: {
            email: userEmail,
        },
        theme: {
            color: '#3b82f6',
        },
    };
}
