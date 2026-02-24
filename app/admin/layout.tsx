import AdminSidebar from '@/components/AdminSidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[calc(100vh-64px)] relative">
            <AdminSidebar />
            <div className="flex-1 w-full min-w-0 bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
                {children}
            </div>
        </div>
    );
}
