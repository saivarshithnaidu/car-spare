'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SparePart } from '@/lib/types';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/ImageUpload';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
    const [products, setProducts] = useState<SparePart[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<SparePart | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        car_model: '',
        price: '',
        stock_quantity: '',
        image_url: '',
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    async function fetchProducts() {
        const { data } = await supabase
            .from('spare_parts')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setProducts(data);
    }

    function openAddModal() {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            car_model: '',
            price: '',
            stock_quantity: '',
            image_url: '',
        });
        setIsModalOpen(true);
    }

    function openEditModal(product: SparePart) {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            car_model: product.car_model,
            price: product.price.toString(),
            stock_quantity: product.stock_quantity.toString(),
            image_url: product.image_url || '',
        });
        setIsModalOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const productData = {
            name: formData.name,
            description: formData.description,
            car_model: formData.car_model,
            price: parseFloat(formData.price),
            stock_quantity: parseInt(formData.stock_quantity),
            image_url: formData.image_url,
        };

        if (editingProduct) {
            // Update
            const { error } = await supabase
                .from('spare_parts')
                .update(productData)
                .eq('id', editingProduct.id);

            if (error) {
                toast.error('Failed to update product');
            } else {
                toast.success('Product updated successfully');
                setIsModalOpen(false);
                fetchProducts();
            }
        } else {
            // Create
            const { error } = await supabase
                .from('spare_parts')
                .insert(productData);

            if (error) {
                toast.error('Failed to create product');
            } else {
                toast.success('Product created successfully');
                setIsModalOpen(false);
                fetchProducts();
            }
        }
    }

    async function handleDelete(id: string, name: string) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

        const { error } = await supabase
            .from('spare_parts')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('Failed to delete product');
        } else {
            toast.success('Product deleted successfully');
            fetchProducts();
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Products Management
                </h1>
                <Button onClick={openAddModal}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Product
                </Button>
            </div>

            <Card>
                <CardBody className="p-0 sm:p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="hidden md:table-header-group bg-gray-100 dark:bg-gray-800">
                                <tr>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 w-20">Image</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Car Model</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Price</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Stock</th>
                                    <th className="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 flex flex-col md:table-row-group">
                                {products.map((product) => (
                                    <tr key={product.id} className="flex flex-col md:table-row p-4 md:p-0 hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-2 md:py-3 flex justify-between items-center md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Image:</span>
                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden shadow-sm border border-gray-100 dark:border-gray-600">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm font-medium text-gray-900 dark:text-white flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Name:</span>
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm text-gray-700 dark:text-gray-300 flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Model:</span>
                                            {product.car_model}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm font-semibold text-gray-900 dark:text-white flex justify-between md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Price:</span>
                                            ₹{product.price.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 md:py-3 text-sm flex justify-between items-center md:table-cell">
                                            <span className="font-bold text-gray-500 md:hidden">Stock:</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.stock_quantity === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                                product.stock_quantity < 10 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                }`}>
                                                {product.stock_quantity}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 md:py-3 text-sm mt-3 md:mt-0 flex justify-end md:table-cell">
                                            <div className="flex gap-2 justify-end w-full md:w-auto">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(product)}
                                                    className="flex-1 md:flex-none"
                                                >
                                                    <Edit className="w-4 h-4 mr-1 md:mr-0" />
                                                    <span className="md:hidden">Edit</span>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(product.id, product.name)}
                                                    className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-1 md:mr-0" />
                                                    <span className="md:hidden">Delete</span>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                            No products found. Click "Add Product" to create one.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardBody>
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Product Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Car Model"
                            value={formData.car_model}
                            onChange={(e) => setFormData({ ...formData, car_model: e.target.value })}
                            required
                        />
                        <Input
                            label="Price (₹)"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Stock Quantity"
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Product Image
                        </label>
                        <ImageUpload
                            bucketName="products"
                            folderPath="product_images"
                            currentImage={formData.image_url}
                            onUploadSuccess={(url) => setFormData({ ...formData, image_url: url })}
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" size="lg" className="flex-1">
                            {editingProduct ? 'Update' : 'Create'} Product
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
