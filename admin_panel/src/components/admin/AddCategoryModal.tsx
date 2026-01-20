import { X, Loader2, Upload, ImageIcon, Link, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../lib/api';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: any;
}

export const AddCategoryModal = ({ isOpen, onClose, category }: AddCategoryModalProps) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageMode, setImageMode] = useState<'url' | 'file'>('file');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        displayOrder: 0,
        parentId: null as string | null,
        isActive: true,
    });

    useEffect(() => {
        if (category) {
            setFormData({
                name: category.name,
                slug: category.slug,
                description: category.description || '',
                imageUrl: category.imageUrl || '',
                displayOrder: category.displayOrder || 0,
                parentId: category.parentId || null,
                isActive: category.isActive ?? true,
            });
            // Set preview if editing existing category with image
            if (category.imageUrl) {
                setImagePreview(category.imageUrl);
                setImageMode('url');
            }
        } else {
            setFormData({
                name: '',
                slug: '',
                description: '',
                imageUrl: '',
                displayOrder: 0,
                parentId: null,
                isActive: true,
            });
            setImagePreview(null);
        }
    }, [category, isOpen]);

    // Fetch categories for parent selection
    const { data: categoriesData } = useQuery({
        queryKey: ['admin-categories-list'],
        queryFn: async () => {
            const res = await api.get('/admin/categories', { params: { limit: 100 } });
            return res.data;
        }
    });

    const parentOptions = categoriesData?.data?.filter((c: any) => c.id !== category?.id) || [];

    // Auto-generate slug from name
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleNameChange = (name: string) => {
        const newSlug = !category ? generateSlug(name) : formData.slug;
        setFormData({ ...formData, name, slug: newSlug });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size must be less than 5MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setImagePreview(base64);
                setFormData({ ...formData, imageUrl: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setFormData({ ...formData, imageUrl: '' });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (category) {
                return api.put(`/admin/categories/${category.id}`, data);
            }
            return api.post('/admin/categories', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
            onClose();
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || error.message || 'Failed to save category';
            alert(`Error: ${message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Sanitize data before sending
        const payload = {
            ...formData,
            parentId: formData.parentId || undefined,
            displayOrder: Number(formData.displayOrder) || 0,
            description: formData.description || undefined,
            imageUrl: formData.imageUrl || undefined,
        };

        mutation.mutate(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-divider overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-divider">
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                        {category ? 'Edit Category' : 'Add New Category'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-text-hint hover:text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form id="category-form" onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Category Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            required
                            placeholder="e.g. Hair Care, Skincare, Electronics"
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">URL Slug <span className="text-text-secondary">(auto-generated)</span></label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            placeholder="e.g. hair-care"
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all text-text-secondary"
                        />
                        <p className="text-[9px] text-text-hint ml-1">Used in URLs: yourstore.com/category/<span className="text-primary">{formData.slug || 'slug'}</span></p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Description <span className="text-text-secondary">(optional)</span></label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Briefly describe what products belong in this category..."
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Display Order</label>
                            <input
                                type="number"
                                value={formData.displayOrder}
                                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                placeholder="0"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                            <p className="text-[9px] text-text-hint ml-1">Lower numbers appear first</p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Parent Category</label>
                            <select
                                value={formData.parentId || ''}
                                onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all appearance-none cursor-pointer"
                            >
                                <option value="">None (Top Level)</option>
                                {parentOptions.map((cat: any) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-divider">
                        <div>
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em]">Status</label>
                            <p className="text-[9px] text-text-hint mt-0.5">{formData.isActive ? 'Visible to customers' : 'Hidden from store'}</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-5 h-5 accent-primary rounded focus:ring-0"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Cover Asset</label>
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
                                            alt="Category preview"
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
                                        <div className="w-16 h-16 rounded-3xl bg-white group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-sm text-text-hint">
                                            <Upload size={24} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs font-black text-text-primary uppercase tracking-tight">Click to upload image</p>
                                            <p className="text-[10px] text-text-hint font-bold mt-1">PNG, JPG or WEBP (MAX. 5MB)</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={(e) => {
                                        setFormData({ ...formData, imageUrl: e.target.value });
                                        setImagePreview(e.target.value);
                                    }}
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                                />
                                {imagePreview && formData.imageUrl && (
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
                        form="category-form"
                        disabled={mutation.isPending}
                        className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : category ? 'Update Node' : 'Initialize Node'}
                    </button>
                </div>
            </div>
        </div>
    );
};
