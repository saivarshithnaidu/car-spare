'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Sun, Moon, LogOut, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCartItemCount } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [cartCount, setCartCount] = useState(0);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Check dark mode preference
        const dark = localStorage.getItem('theme') === 'dark';
        setIsDark(dark);
        if (dark) {
            document.documentElement.classList.add('dark');
        }

        // Check auth state
        checkUser();

        // Listen to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('Auth state changed:', _event, session?.user?.email);
            if (session?.user) {
                checkUser();
            } else {
                setUser(null);
                setIsAdmin(false);
            }
        });

        // Update cart count
        updateCartCount();

        // Listen for cart changes
        const handleCartUpdate = () => updateCartCount();
        window.addEventListener('cartUpdated', handleCartUpdate);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    async function checkUser() {
        try {
            console.log('Checking user...');
            const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

            console.log('Auth user:', authUser?.email, 'Error:', authError);

            if (authError || !authUser) {
                console.log('No auth user found');
                setUser(null);
                setIsAdmin(false);
                return;
            }

            // Try to get user data from users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            console.log('User data from table:', userData, 'Error:', userError);

            if (userError) {
                console.error('Error fetching user data:', userError);
                // Even if we can't get user data, show that user is logged in
                setUser({ id: authUser.id, email: authUser.email, role: 'customer' });
                setIsAdmin(false);
            } else if (userData) {
                console.log('User role:', userData.role);
                setUser(userData);
                setIsAdmin(userData?.role === 'admin');
            }
        } catch (error) {
            console.error('Error in checkUser:', error);
        }
    }

    function updateCartCount() {
        setCartCount(getCartItemCount());
    }

    function toggleDarkMode() {
        const newDark = !isDark;
        setIsDark(newDark);
        if (newDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        setUser(null);
        setIsAdmin(false);
        toast.success('Logged out successfully');
        window.location.href = '/';
    }

    return (
        <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">CS</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900 dark:text-white hidden sm:block">
                            Car Spare
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="/products" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Products
                        </Link>
                        {isAdmin && (
                            <Link href="/admin/dashboard" className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium transition-colors">
                                Admin
                            </Link>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center space-x-4">
                        {/* Dark Mode Toggle */}
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Cart */}
                        <Link href="/cart" className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <ShoppingCart className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-scale-in">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {/* User Menu */}
                        {user ? (
                            <div className="hidden md:flex items-center space-x-2">
                                <Link href="/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="My Orders">
                                    <Package className="w-5 h-5" />
                                </Link>
                                <Link href="/profile" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" title="Profile">
                                    <User className="w-5 h-5" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center space-x-2">
                                <Link href="/login" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                    Login
                                </Link>
                                <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                    Sign Up
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800 animate-slide-down">
                        <div className="flex flex-col space-y-3">
                            <Link href="/products" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                Products
                            </Link>
                            {isAdmin && (
                                <Link href="/admin/dashboard" className="px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 rounded-lg transition-colors">
                                    Admin Dashboard
                                </Link>
                            )}
                            {user ? (
                                <>
                                    <Link href="/orders" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                        My Orders
                                    </Link>
                                    <Link href="/profile" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                        Login
                                    </Link>
                                    <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
