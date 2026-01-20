import { X, Loader2, Upload, Link, Trash2, ImageIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { uploadImage } from '../../lib/imageUpload';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: any; // If provided, we are in Edit mode
}

export const AddProductModal = ({ isOpen, onClose, product }: AddProductModalProps) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageMode, setImageMode] = useState<'url' | 'file'>('file');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        slug: '',
        brand: '',
        shortDescription: '',
        basePrice: 0,
        stockQuantity: 0,
        categoryId: '', // Default or fetch categories
        isFeatured: false,
        isActive: true,
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku,
                slug: product.slug,
                brand: product.brand || '',
                shortDescription: product.shortDescription || '',
                basePrice: product.basePrice,
                stockQuantity: product.stockQuantity,
                categoryId: product.categoryId,
                isFeatured: product.isFeatured || false,
                isActive: product.isActive ?? true,
            });

            // Set preview if editing existing product with image
            const img = product.mainImage || (product.images && product.images.length > 0 ? product.images[0].imageUrl : null);
            if (img) {
                setImagePreview(img);
                setUploadedImageUrl(img);
                setImageMode('url');
            } else {
                setImagePreview(null);
                setUploadedImageUrl('');
            }
        } else {
            setFormData({
                name: '',
                sku: '',
                slug: '',
                brand: '',
                shortDescription: '',
                basePrice: 0,
                stockQuantity: 0,
                categoryId: '',
                isFeatured: false,
                isActive: true,
            });
            setImagePreview(null);
            setUploadedImageUrl('');
        }
    }, [product, isOpen]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setUploadedImageUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }

            // Show preview immediately using local URL
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setIsUploading(true);

            try {
                // Upload to R2 and get HTTP URL
                const httpUrl = await uploadImage(file);
                setUploadedImageUrl(httpUrl);
                setImagePreview(httpUrl);
            } catch (error: any) {
                alert(`Failed to upload image: ${error.message}`);
                setImagePreview(null);
                setUploadedImageUrl('');
            } finally {
                setIsUploading(false);
                URL.revokeObjectURL(previewUrl);
            }
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const name = e.target.value;
        // Only auto-generate slug if not in edit mode or if manually edited logic allows
        // For simplicity, we'll auto-update slug only if it hasn't been manually modified, 
        // but checking "manually modified" is complex. 
        // Let's just update it if we are CREATING (no product prop) or provide a helper button to regenerate.
        // Actually, standard behavior: auto-generate only if slug is empty or user is typing name for first time.
        // We'll just set it equal to name-slugified if user hasn't touched the slug field? 
        // Let's keep it simple: Auto-update slug when Name changes ONLY IF creating new product.

        let newFormData = { ...formData, name };

        if (!product) {
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            newFormData.slug = slug;
        }

        setFormData(newFormData);
    };
    const { data: categoriesData } = useQuery({
        queryKey: ['admin-categories-list'],
        queryFn: async () => {
            const res = await api.get('/admin/categories', { params: { limit: 100 } });
            return res.data;
        }
    });

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            let productId;

            // 1. Create or Update Product
            if (product) {
                productId = product.id;
                await api.put(`/admin/products/${productId}`, data);
            } else {
                const res = await api.post('/admin/products', data);
                productId = res.data.id;
            }

            // 2. Add Image if available and changed
            if (uploadedImageUrl && uploadedImageUrl !== (product?.mainImage)) {
                await api.post(`/admin/products/${productId}/images`, {
                    imageUrl: uploadedImageUrl,
                    isPrimary: true,
                    displayOrder: 0
                });
            }

            return { id: productId };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            onClose();
        },
        onError: (error: any) => {
            console.error('Submit Error:', error);
            const message = error.response?.data?.error?.message
                || error.response?.data?.message
                || error.message
                || 'Failed to save product';

            // Try to extract Zod issues if present
            const issues = error.response?.data?.error?.issues;
            const detailedMessage = issues
                ? `${message}: ${issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
                : message;

            alert(`Error: ${detailedMessage}`);
        }
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!e.currentTarget.checkValidity()) {
            e.currentTarget.reportValidity();
            return;
        }

        const payload: any = {
            ...formData,
            // Ensure numbers
            basePrice: Number(formData.basePrice),
            stockQuantity: Number(formData.stockQuantity),
        };

        // Clean up optional empty strings to undefined
        if (!payload.brand) delete payload.brand;
        if (!payload.categoryId) delete payload.categoryId;
        if (!payload.sku) delete payload.sku; // Let backend auto-generate SKU if not provided
        if (payload.categoryId === 'cat-123') delete payload.categoryId; // Remove dummy default

        mutation.mutate(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-divider overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-divider">
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-text-hint hover:text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form id="product-form" onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Product Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={handleNameChange}
                                required
                                placeholder="e.g. Beard Growth Oil"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">URL Slug <span className="text-text-secondary">(auto)</span></label>
                            <input
                                type="text"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                required
                                placeholder="e.g. beard-growth-oil"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all text-text-secondary"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">SKU (Unique Code) <span className="text-text-secondary">(auto-generated)</span></label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                placeholder="Leave empty to auto-generate"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Brand <span className="text-text-secondary">(optional)</span></label>
                            <input
                                type="text"
                                value={formData.brand}
                                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                placeholder="e.g. Your Brand Name"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Short Description * <span className="text-text-secondary">({formData.shortDescription.length}/500)</span></label>
                        <textarea
                            rows={3}
                            value={formData.shortDescription}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                            required
                            maxLength={500}
                            placeholder="Briefly describe your product - this appears in search results and product cards..."
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Category</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Select Category</option>
                                {categoriesData?.data?.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Price ($) *</label>
                            <input
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                                step="0.01"
                                min="0.01"
                                required
                                placeholder="29.99"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Stock Quantity</label>
                            <input
                                type="number"
                                value={formData.stockQuantity}
                                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                                min="0"
                                placeholder="100"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-divider">
                            <div>
                                <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em]">Featured Product</label>
                                <p className="text-[9px] text-text-hint mt-0.5">Show on homepage</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.isFeatured}
                                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                className="w-5 h-5 accent-primary rounded focus:ring-0"
                            />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-divider">
                            <div>
                                <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em]">Status</label>
                                <p className="text-[9px] text-text-hint mt-0.5">{formData.isActive ? 'Visible in store' : 'Hidden'}</p>
                            </div>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="w-5 h-5 accent-primary rounded focus:ring-0"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Product Image</label>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setImageMode('file')}
                                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${imageMode === 'file' ? 'bg-primary text-white' : 'bg-surface text-text-hint hover:text-primary'
                                        }`}
                                >
                                    <Upload size={12} className="inline mr-1" />
                                    Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageMode('url')}
                                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${imageMode === 'url' ? 'bg-primary text-white' : 'bg-surface text-text-hint hover:text-primary'
                                        }`}
                                >
                                    <Link size={12} className="inline mr-1" />
                                    URL
                                </button>
                            </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {imageMode === 'file' ? (
                            <div
                                onClick={handleImageClick}
                                className="relative border-2 border-dashed border-divider rounded-[2rem] overflow-hidden hover:border-primary transition-all cursor-pointer group bg-surface/30"
                            >
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Product preview"
                                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="text-center text-white">
                                                <ImageIcon size={32} className="mx-auto mb-2" />
                                                <p className="text-xs font-black uppercase tracking-tight">Click to change</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); handleRemoveImage(); }}
                                            className="absolute top-3 right-3 p-2 bg-rose-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 shadow-lg"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-10 flex flex-col items-center justify-center gap-4">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 size={32} className="animate-spin text-primary" />
                                                <p className="text-xs font-black text-text-primary uppercase tracking-tight">Uploading...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-3xl bg-white group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-sm text-text-hint">
                                                    <Upload size={24} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-black text-text-primary uppercase tracking-tight">Click to upload image</p>
                                                    <p className="text-[10px] text-text-hint font-bold mt-1">PNG, JPG or WEBP (MAX. 5MB)</p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={uploadedImageUrl}
                                    onChange={(e) => {
                                        setUploadedImageUrl(e.target.value);
                                        setImagePreview(e.target.value);
                                    }}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                                />
                                {imagePreview && uploadedImageUrl && (
                                    <div className="relative rounded-2xl overflow-hidden border border-divider">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-full h-32 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </form>

                <div className="p-8 border-t border-divider bg-surface/50 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-4 border border-divider rounded-2xl font-black text-[10px] uppercase tracking-widest text-text-secondary hover:bg-white transition-all active:scale-95"
                    >
                        Abort
                    </button>
                    <button
                        type="submit"
                        form="product-form"
                        disabled={mutation.isPending}
                        className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : product ? 'Update System Node' : 'Initialize Catalog Node'}
                    </button>
                </div>
            </div>
        </div>
    );
};
