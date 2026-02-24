'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { CartItem } from '@/lib/types';
import { getCart, updateCartItemQuantity, removeFromCart, calculateCartTotal } from '@/lib/cart';
import Card, { CardBody, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CartPage() {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [totals, setTotals] = useState({ subtotal: 0, gst: 0, total: 0 });

    useEffect(() => {
        loadCart();
    }, []);

    function loadCart() {
        const items = getCart();
        setCartItems(items);
        setTotals(calculateCartTotal(items));
    }

    function handleUpdateQuantity(sparePartId: string, newQuantity: number) {
        updateCartItemQuantity(sparePartId, newQuantity);
        loadCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success('Cart updated');
    }

    function handleRemoveItem(sparePartId: string, productName: string) {
        removeFromCart(sparePartId);
        loadCart();
        window.dispatchEvent(new Event('cartUpdated'));
        toast.success(`Removed ${productName} from cart`);
    }

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12">
                <Card className="text-center p-12 max-w-md mx-4">
                    <CardBody>
                        <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Your cart is empty
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Add some products to get started
                        </p>
                        <Link href="/products">
                            <Button size="lg">Browse Products</Button>
                        </Link>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
                    Shopping Cart
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {cartItems.map((item) => (
                            <Card key={item.spare_part.id}>
                                <CardBody>
                                    <div className="flex gap-4">
                                        {/* Product Image */}
                                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                            {item.spare_part.image_url ? (
                                                <img
                                                    src={item.spare_part.image_url}
                                                    alt={item.spare_part.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingCart className="w-10 h-10 text-gray-400" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                                {item.spare_part.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {item.spare_part.car_model}
                                            </p>
                                            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-1">
                                                ₹{item.spare_part.price.toFixed(2)}
                                            </p>
                                        </div>

                                        {/* Quantity Controls */}
                                        <div className="flex flex-col items-end justify-between">
                                            <button
                                                onClick={() => handleRemoveItem(item.spare_part.id, item.spare_part.name)}
                                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors p-2"
                                                title="Remove item"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>

                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleUpdateQuantity(item.spare_part.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </Button>
                                                <span className="text-lg font-semibold w-8 text-center">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleUpdateQuantity(item.spare_part.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.spare_part.stock_quantity}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                ₹{(item.spare_part.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-20">
                            <CardBody>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                    Order Summary
                                </h2>

                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>Subtotal:</span>
                                        <span>₹{totals.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                        <span>GST (18%):</span>
                                        <span>₹{totals.gst.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-2xl font-bold text-gray-900 dark:text-white">
                                        <span>Total:</span>
                                        <span className="text-blue-600 dark:text-blue-400">
                                            ₹{totals.total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </CardBody>

                            <CardFooter>
                                <div className="space-y-2">
                                    <Link href="/checkout" className="block">
                                        <Button size="lg" className="w-full">
                                            Proceed to Checkout
                                        </Button>
                                    </Link>
                                    <Link href="/products" className="block">
                                        <Button variant="outline" size="lg" className="w-full">
                                            Continue Shopping
                                        </Button>
                                    </Link>
                                </div>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
