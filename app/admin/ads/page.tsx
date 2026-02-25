'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Ad } from '@/lib/types';
import Card, { CardBody } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/ImageUpload';
import toast from 'react-hot-toast';

export default function AdminAdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        redirect_url: '',
        active: true,
    });

    useEffect(() => {
        fetchAds();
    }, []);

    async function fetchAds() {
        try {
            const res = await fetch('/api/ads');
            if (res.ok) {
                const data = await res.json();
                setAds(data);
            }
        } catch (error) {
            console.error('Failed to fetch ads', error);
        }
    }

    function openAddModal() {
        setEditingAd(null);
        setFormData({ title: '', image_url: '', redirect_url: '', active: true });
        setIsModalOpen(true);
    }

    function openEditModal(ad: Ad) {
        setEditingAd(ad);
        setFormData({
            title: ad.title,
            image_url: ad.image_url,
            redirect_url: ad.redirect_url || '',
            active: ad.active,
        });
        setIsModalOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        try {
            if (editingAd) {
                const res = await fetch(`/api/ads/${editingAd.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) throw new Error();
                toast.success('Ad updated successfully');
            } else {
                const res = await fetch('/api/ads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (!res.ok) throw new Error();
                toast.success('Ad created successfully');
            }
            setIsModalOpen(false);
            fetchAds();
        } catch (error) {
            toast.error(editingAd ? 'Failed to update ad' : 'Failed to create ad');
        }
    }

    async function toggleActive(id: string, currentStatus: boolean) {
        try {
            const res = await fetch(`/api/ads/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentStatus })
            });

            if (!res.ok) throw new Error();
            toast.success('Ad status updated');
            fetchAds();
        } catch (error) {
            toast.error('Failed to toggle ad status');
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this ad?')) return;

        try {
            const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Ad deleted successfully');
            fetchAds();
        } catch (error) {
            toast.error('Failed to delete ad');
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    Advertisements Management
                </h1>
                <Button onClick={openAddModal}>
                    <Plus className="w-5 h-5 mr-2" />
                    Add Ad
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {ads.map((ad) => (
                    <Card key={ad.id}>
                        <CardBody>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-32 h-48 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden flex-shrink-0">
                                    {ad.image_url ? (
                                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ImageIcon className="w-12 h-12 text-gray-400" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                        {ad.title}
                                    </h3>
                                    {ad.redirect_url && (
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate max-w-full">
                                            {ad.redirect_url}
                                        </p>
                                    )}
                                    <div className="mt-auto pt-2 sm:pt-0">
                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${ad.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {ad.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex sm:flex-col gap-2 justify-end sm:justify-start mt-4 sm:mt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 pt-4 sm:pt-0">
                                    <button
                                        onClick={() => toggleActive(ad.id, ad.active)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex-1 sm:flex-none flex justify-center items-center"
                                        title={ad.active ? 'Deactivate' : 'Activate'}
                                    >
                                        {ad.active ? (
                                            <ToggleRight className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <ToggleLeft className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(ad)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded flex-1 sm:flex-none flex justify-center items-center"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ad.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded flex-1 sm:flex-none flex justify-center items-center"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>

            {ads.length === 0 && (
                <Card>
                    <CardBody>
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No advertisements found. Create one to get started!
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Ad Image <span className="text-red-500">*</span>
                        </label>
                        <ImageUpload
                            bucketName="ads"
                            folderPath="banners"
                            currentImage={formData.image_url}
                            onUploadSuccess={(url) => setFormData({ ...formData, image_url: url })}
                        />
                    </div>

                    <Input
                        label="Redirect URL (Optional)"
                        type="url"
                        value={formData.redirect_url}
                        onChange={(e) => setFormData({ ...formData, redirect_url: e.target.value })}
                        placeholder="https://example.com/promo"
                    />

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="active"
                            checked={formData.active}
                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" size="lg" className="flex-1">
                            {editingAd ? 'Update' : 'Create'} Ad
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
