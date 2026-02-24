'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, ShoppingCart, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SparePart } from '@/lib/types';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { addToCart } from '@/lib/cart';
import toast from 'react-hot-toast';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [product, setProduct] = useState<SparePart | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [unwrappedParams.id]);

    async function fetchProduct() {
        const { data, error } = await supabase
            .from('spare_parts')
            .select('*')
            .eq('id', unwrappedParams.id)
            .single();

        if (data) {
            setProduct(data);
        } else {
            toast.error('Product not found');
            router.push('/products');
        }
        setLoading(false);
    }

    function handleAddToCart() {
        if (!product) return;

        if (quantity > product.stock_quantity) {
            toast.error('Quantity exceeds available stock');
            return;
        }

        addToCart(product, quantity);
        toast.success(`Added ${quantity} item(s) to cart`);
        window.dispatchEvent(new Event('cartUpdated'));
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="skeleton h-96 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!product) return null;

    const subtotal = product.price * quantity;
    const gst = subtotal * 0.18;
    const total = subtotal + gst;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link href="/products" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Products
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Product Image */}
                    <Card>
                        <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden rounded-xl">
                            {product.image_url ? (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <Package className="w-32 h-32 text-gray-400" />
                                </div>
                            )}

                            {/* Stock Badge */}
                            {product.stock_quantity === 0 ? (
                                <span className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg">
                                    Out of Stock
                                </span>
                            ) : product.stock_quantity < 10 && (
                                <span className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-full font-semibold shadow-lg flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Only {product.stock_quantity} left!
                                </span>
                            )}
                        </div>
                    </Card>

                    {/* Product Details */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                                {product.name}
                            </h1>
                            <p className="text-xl text-blue-600 dark:text-blue-400 font-semibold">
                                {product.car_model}
                            </p>
                        </div>

                        <Card>
                            <CardBody>
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h3>
                                        <p className="text-gray-900 dark:text-white">
                                            {product.description || 'No description available'}
                                        </p>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Stock Information</h3>
                                        <p className="text-gray-900 dark:text-white">
                                            {product.stock_quantity > 0 ? (
                                                <span className="text-green-600 dark:text-green-400 font-semibold">
                                                    {product.stock_quantity} units available
                                                </span>
                                            ) : (
                                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                                    Currently out of stock
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Price Card */}
                        <Card>
                            <CardBody>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-lg">
                                        <span className="text-gray-700 dark:text-gray-300">Price per unit:</span>
                                        <span className="font-semibold text-gray-900 dark:text-white">₹{product.price.toFixed(2)}</span>
                                    </div>

                                    {/* Quantity Selector */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-700 dark:text-gray-300">Quantity:</span>
                                        <div className="flex items-center space-x-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={product.stock_quantity === 0}
                                            >
                                                -
                                            </Button>
                                            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                                                disabled={product.stock_quantity === 0}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2">
                                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                            <span>Subtotal:</span>
                                            <span>₹{subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-700 dark:text-gray-300">
                                            <span>GST (18%):</span>
                                            <span>₹{gst.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
                                            <span>Total:</span>
                                            <span className="text-blue-600 dark:text-blue-400">₹{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardBody>
                        </Card>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className="flex-1"
                                onClick={handleAddToCart}
                                disabled={product.stock_quantity === 0}
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Add to Cart
                            </Button>
                            <Link href="/cart" className="flex-1">
                                <Button variant="outline" size="lg" className="w-full">
                                    View Cart
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
