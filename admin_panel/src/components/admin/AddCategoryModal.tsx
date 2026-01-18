import { X, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface AddCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: any;
}

export const AddCategoryModal = ({ isOpen, onClose, category }: AddCategoryModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        imageUrl: '',
        displayOrder: 0,
        parentId: null as string | null,
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
            });
        } else {
            setFormData({
                name: '',
                slug: '',
                description: '',
                imageUrl: '',
                displayOrder: 0,
                parentId: null,
            });
        }
    }, [category, isOpen]);

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
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-divider overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-divider">
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                        {category ? 'Edit Classification' : 'New Classification Node'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-text-hint hover:text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Classification Designation</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g. Beard Care"
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">URL Semantic Slug</label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            placeholder="beard-care"
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Specifications (Description)</label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the classification scope..."
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Index Priority (Order)</label>
                            <input
                                type="number"
                                value={formData.displayOrder}
                                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Parent Node</label>
                            <select
                                value={formData.parentId || ''}
                                onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all appearance-none"
                            >
                                <option value="">None (Root Node)</option>
                                {/* We could map existing categories here if needed */}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Cover Asset URL</label>
                        <input
                            type="text"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                        />
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
                        onClick={handleSubmit}
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
