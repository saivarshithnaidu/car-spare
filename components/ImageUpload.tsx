import React, { useState, useRef, ChangeEvent } from 'react';
import { UploadCloud, X, Camera, Image as ImageIcon, Loader } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface ImageUploadProps {
    bucketName: 'products' | 'ads';
    onUploadSuccess: (url: string) => void;
    currentImage?: string;
    folderPath?: string;
    className?: string;
}

export default function ImageUpload({
    bucketName,
    onUploadSuccess,
    currentImage,
    folderPath = '',
    className = ''
}: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync external prop changes
    React.useEffect(() => {
        if (currentImage) {
            setPreviewUrl(currentImage);
        }
    }, [currentImage]);

    const triggerFileInput = (captureMode?: 'environment') => {
        if (fileInputRef.current) {
            if (captureMode) {
                fileInputRef.current.setAttribute('capture', captureMode);
            } else {
                fileInputRef.current.removeAttribute('capture');
            }
            fileInputRef.current.click();
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await processFile(e.target.files[0]);
            // Reset input so the same file can be selected again if needed
            e.target.value = '';
        }
    };

    const processFile = async (file: File) => {
        // Validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload a valid image file');
            return;
        }

        const maxSizeMB = 5;
        if (file.size > maxSizeMB * 1024 * 1024) {
            toast.error(`Image size should be less than ${maxSizeMB}MB`);
            return;
        }

        // Show local preview immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Upload to Supabase Storage
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

            const { error: uploadError, data } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            onUploadSuccess(publicUrl);
            toast.success('Image uploaded successfully');

        } catch (error: any) {
            console.error('Upload Error:', error);
            toast.error(error.message || 'Failed to upload image');
            // Revert preview on failure
            setPreviewUrl(currentImage || null);
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreviewUrl(null);
        onUploadSuccess('');
    };

    return (
        <div className={`w-full ${className}`}>
            <div
                className={`
                    relative w-full border-2 border-dashed rounded-xl overflow-hidden transition-all duration-200 ease-in-out
                    ${isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : previewUrl
                            ? 'border-transparent'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50'
                    }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />

                {previewUrl ? (
                    <div className="relative group w-full aspect-video sm:aspect-[4/3] md:aspect-video lg:aspect-auto lg:h-48">
                        <img
                            src={previewUrl}
                            alt="Upload preview"
                            className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                        />

                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            {!isUploading && (
                                <>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-100 shadow-lg transform hover:scale-105 transition-all"
                                        title="Change Image"
                                    >
                                        <UploadCloud className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                                        title="Remove Image"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                        </div>

                        {isUploading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                                <Loader className="w-8 h-8 animate-spin mb-2" />
                                <span className="text-sm font-medium">Uploading...</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <UploadCloud className="w-8 h-8" />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            Click to upload or drag and drop
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-6">
                            SVG, PNG, JPG or GIF (max. 5MB)
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => triggerFileInput()}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                            >
                                <ImageIcon className="w-4 h-4 mr-2" />
                                Browse Files
                            </button>
                            <button
                                type="button"
                                onClick={() => triggerFileInput('environment')}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm lg:hidden"
                            >
                                <Camera className="w-4 h-4 mr-2" />
                                Take Photo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
