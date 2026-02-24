'use client';

import { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SparePart } from '@/lib/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { addToCart } from '@/lib/cart';
import toast from 'react-hot-toast';

export default function ProductsPage() {
    const [products, setProducts] = useState<SparePart[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<SparePart[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModel, setSelectedModel] = useState('all');
    const [carModels, setCarModels] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, selectedModel, products]);

    async function fetchProducts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('spare_parts')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setProducts(data);

            // Extract unique car models
            const models = Array.from(new Set(data.map(p => p.car_model)));
            setCarModels(models);
        }
        setLoading(false);
    }

    function filterProducts() {
        let filtered = products;

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.car_model.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Car model filter
        if (selectedModel !== 'all') {
            filtered = filtered.filter(p => p.car_model === selectedModel);
        }

        setFilteredProducts(filtered);
        setCurrentPage(1); // Reset to first page when filtering
    }

    function handleAddToCart(product: SparePart) {
        if (product.stock_quantity === 0) {
            toast.error('Product is out of stock');
            return;
        }

        addToCart(product, 1);
        toast.success('Added to cart');
        window.dispatchEvent(new Event('cartUpdated'));
    }

    // Pagination
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Spare Parts Catalog
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Browse our extensive collection of genuine car spare parts
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search parts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Car Model Filter */}
                    <div className="sm:w-64">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                            >
                                <option value="all">All Car Models</option>
                                {carModels.map(model => (
                                    <option key={model} value={model}>{model}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-gray-600 dark:text-gray-400">
                    Showing {currentProducts.length} of {filteredProducts.length} products
                </div>

                {/* Products Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="skeleton h-80 rounded-xl" />
                        ))}
                    </div>
                ) : currentProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {currentProducts.map((product) => (
                                <Card key={product.id} hover>
                                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 relative overflow-hidden rounded-t-xl">
                                        {product.image_url ? (
                                            <img
                                                src={product.image_url}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <Package className="w-16 h-16 text-gray-400" />
                                            </div>
                                        )}

                                        {/* Stock badge */}
                                        {product.stock_quantity === 0 ? (
                                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                Out of Stock
                                            </span>
                                        ) : product.stock_quantity < 10 && (
                                            <span className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                                Low Stock ({product.stock_quantity})
                                            </span>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white line-clamp-1">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            {product.car_model}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-3 line-clamp-2">
                                            {product.description}
                                        </p>

                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                ₹{product.price.toFixed(2)}
                                            </span>
                                        </div>

                                        <div className="flex gap-2">
                                            <Link href={`/product/${product.id}`} className="flex-1">
                                                <Button variant="outline" size="sm" className="w-full">
                                                    View Details
                                                </Button>
                                            </Link>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.stock_quantity === 0}
                                            >
                                                Add to Cart
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex justify-center items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>

                                <div className="flex gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${currentPage === i + 1
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-xl text-gray-600 dark:text-gray-400">
                            No products found matching your criteria
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
