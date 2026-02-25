import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';

export async function GET(request: Request) {
    try {
        // 1. Total Sales
        const { data: paidOrders } = await supabaseServer
            .from('orders')
            .select('total_amount')
            .eq('payment_status', 'paid');
        const totalSales = paidOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

        // 2. Total Orders
        const { count: totalOrders } = await supabaseServer
            .from('orders')
            .select('*', { count: 'exact', head: true });

        // 3. Pending Payments from khatabook
        const { data: khatabookData } = await supabaseServer
            .from('khatabook')
            .select('pending_amount')
            .eq('status', 'pending');
        const pendingPayments = khatabookData?.reduce((sum, entry) => sum + entry.pending_amount, 0) || 0;

        // 4. Low Stock items
        const { count: lowStockCount } = await supabaseServer
            .from('spare_parts')
            .select('*', { count: 'exact', head: true })
            .lt('stock_quantity', 10)
            .gt('stock_quantity', 0);

        // --- NEW CUSTOMER STATS ---
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        // 5. Total Customers
        const { count: totalCustomers } = await supabaseServer
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer');

        // 6. New Customers (last 7 days)
        const { count: newCustomers } = await supabaseServer
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer')
            .gte('created_at', sevenDaysAgo);

        // 7. Active Today
        const { count: activeToday } = await supabaseServer
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'customer')
            .gte('last_login', startOfDay);

        // 8. Fetch recent orders
        const { data: recentOrders } = await supabaseServer
            .from('orders')
            .select('*, users(email)')
            .order('created_at', { ascending: false })
            .limit(5);

        // 9. Fetch recent customers
        const { data: recentCustomers } = await supabaseServer
            .from('users')
            .select('id, full_name, email, created_at')
            .eq('role', 'customer')
            .order('created_at', { ascending: false })
            .limit(5);

        // 10. Payment status stats
        const { data: allOrders } = await supabaseServer.from('orders').select('payment_status');
        const paidCount = allOrders?.filter(o => o.payment_status === 'paid').length || 0;
        const pendingCount = allOrders?.filter(o => o.payment_status === 'pending').length || 0;
        const failedCount = allOrders?.filter(o => o.payment_status === 'failed').length || 0;

        // Return aggregated data
        return NextResponse.json({
            stats: {
                totalSales,
                totalOrders: totalOrders || 0,
                pendingPayments,
                lowStockCount: lowStockCount || 0,
                totalCustomers: totalCustomers || 0,
                newCustomers: newCustomers || 0,
                activeToday: activeToday || 0,
            },
            recentOrders: recentOrders || [],
            recentCustomers: recentCustomers || [],
            paymentStats: { paid: paidCount, pending: pendingCount, failed: failedCount }
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
