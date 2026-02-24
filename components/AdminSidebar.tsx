'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, BookOpen, Image, Users, FileText, Menu, X } from 'lucide-react';

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change on mobile
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const links = [
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/products', icon: Package, label: 'Products' },
        { href: '/admin/orders', icon: ShoppingBag, label: 'Online Orders' },
        { href: '/admin/offline-bill', icon: FileText, label: 'Offline Bill' },
        { href: '/admin/khatabook', icon: BookOpen, label: 'Khatabook' },
        { href: '/admin/customers', icon: Users, label: 'Customers' },
        { href: '/admin/ads', icon: Image, label: 'Advertisements' },
    ];

    return (
        <>
            {/* Mobile Hamburger Toggle */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-2xl hover:bg-blue-700 transition-transform active:scale-95"
                aria-label="Toggle Admin Menu"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:sticky top-0 lg:top-[64px] left-0 z-40 
                    w-64 h-[100dvh] lg:h-[calc(100vh-64px)] 
                    bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
                    p-4 overflow-y-auto transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                <div className="lg:hidden mb-6 px-4">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin Panel</h2>
                </div>

                <div className="space-y-1">
                    {links.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`
                                    flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-md font-semibold'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                                    }
                                `}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </aside>
        </>
    );
}
