import { X, Loader2, Upload, Link, Trash2, ImageIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { uploadImage } from '../../lib/imageUpload';

interface AddBannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    banner?: any;
}

export const AddBannerModal = ({ isOpen, onClose, banner }: AddBannerModalProps) => {
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageMode, setImageMode] = useState<'url' | 'file'>('file');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        imageUrl: '',
        link: '',
        displayOrder: 0,
        isActive: true,
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        if (banner) {
            setFormData({
                title: banner.title,
                imageUrl: banner.imageUrl,
                link: banner.link || '',
                displayOrder: banner.displayOrder || 0,
                isActive: banner.isActive,
                startDate: banner.startDate ? banner.startDate.split('T')[0] : '',
                endDate: banner.endDate ? banner.endDate.split('T')[0] : '',
            });
            if (banner.imageUrl) {
                setImagePreview(banner.imageUrl);
                setImageMode('url');
            }
        } else {
            setFormData({
                title: '',
                imageUrl: '',
                link: '',
                displayOrder: 0,
                isActive: true,
                startDate: '',
                endDate: '',
            });
            setImagePreview(null);
        }
    }, [banner, isOpen]);

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

            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setIsUploading(true);

            try {
                const httpUrl = await uploadImage(file);
                setFormData({ ...formData, imageUrl: httpUrl });
                setImagePreview(httpUrl);
            } catch (error: any) {
                alert(`Failed to upload image: ${error.message}`);
                setImagePreview(null);
                setFormData({ ...formData, imageUrl: '' });
            } finally {
                setIsUploading(false);
                URL.revokeObjectURL(previewUrl);
            }
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (banner) {
                return api.put(`/admin/banners/${banner.id}`, data);
            }
            return api.post('/admin/banners', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
            onClose();
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || error.message || 'Failed to save banner';
            alert(`Error: ${message}`);
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.imageUrl) {
            alert('Please provide an image URL or upload an image');
            return;
        }

        const cleanPayload = {
            title: formData.title,
            imageUrl: formData.imageUrl,
            linkType: 'external',
            linkValue: formData.link,
            displayOrder: Number(formData.displayOrder) || 0,
            isActive: formData.isActive,
            startsAt: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
            endsAt: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            bannerType: 'promotional',
        };

        mutation.mutate(cleanPayload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-divider overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-divider">
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                        {banner ? 'Edit Banner' : 'Add New Banner'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-text-hint hover:text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form id="banner-form" onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Banner Title *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="e.g. Summer Sale - 50% Off"
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Banner Image * <span className="text-text-secondary">(21:9 recommended)</span></label>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setImageMode('file')}
                                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${imageMode === 'file' ? 'bg-primary text-white' : 'bg-surface text-text-hint hover:text-primary'}`}
                                >
                                    <Upload size={12} className="inline mr-1" />
                                    Upload
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageMode('url')}
                                    className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${imageMode === 'url' ? 'bg-primary text-white' : 'bg-surface text-text-hint hover:text-primary'}`}
                                >
                                    <Link size={12} className="inline mr-1" />
                                    URL
                                </button>
                            </div>
                        </div>

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
                                            alt="Banner preview"
                                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                <div className="text-center text-white">
                                                    <Loader2 size={32} className="mx-auto mb-2 animate-spin" />
                                                    <p className="text-xs font-black uppercase tracking-tight">Uploading...</p>
                                                </div>
                                            </div>
                                        )}
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
                                    value={formData.imageUrl}
                                    onChange={(e) => {
                                        setFormData({ ...formData, imageUrl: e.target.value });
                                        setImagePreview(e.target.value);
                                    }}
                                    placeholder="https://images.example.com/banner.jpg"
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

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Link <span className="text-text-secondary">(optional)</span></label>
                        <input
                            type="text"
                            value={formData.link}
                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                            placeholder="/collections/summer or https://..."
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Start Date</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">End Date</label>
                            <input
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
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
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Status</label>
                            <div className="flex items-center gap-4 py-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-primary' : 'bg-divider'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isActive ? 'left-7' : 'left-1'}`} />
                                </button>
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                    {formData.isActive ? 'Active' : 'Hidden'}
                                </span>
                            </div>
                        </div>
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
                        form="banner-form"
                        disabled={mutation.isPending || isUploading}
                        className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin" size={16} /> : banner ? 'Save Changes' : 'Create Banner'}
                    </button>
                </div>
            </div>
        </div>
    );
};
