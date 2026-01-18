import { X, Plus, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: any; // If provided, we are in Edit mode
}

export const AddProductModal = ({ isOpen, onClose, product }: AddProductModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        shortDescription: '',
        basePrice: 0,
        stockQuantity: 0,
        categoryId: 'cat-123', // Default or fetch categories
    });

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                sku: product.sku,
                shortDescription: product.shortDescription || '',
                basePrice: product.basePrice,
                stockQuantity: product.stockQuantity,
                categoryId: product.categoryId,
            });
        } else {
            setFormData({
                name: '',
                sku: '',
                shortDescription: '',
                basePrice: 0,
                stockQuantity: 0,
                categoryId: 'cat-123',
            });
        }
    }, [product, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (product) {
                return api.put(`/admin/products/${product.id}`, data);
            }
            return api.post('/admin/products', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
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
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-divider overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-divider">
                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                        {product ? 'Edit Entity' : 'New Catalog Entry'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-text-hint hover:text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Product Designation</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g. Growth Oil"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Serial identifier (SKU)</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                required
                                placeholder="DM-GRO-01"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Inventory Abstract (Short Description)</label>
                        <textarea
                            rows={3}
                            value={formData.shortDescription}
                            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                            placeholder="Briefly describe your product specifications..."
                            className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Classification</label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all appearance-none"
                            >
                                <option value="cat-123">Beard Care</option>
                                <option value="cat-456">Hair Care</option>
                                <option value="cat-789">Face Care</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Base Valuation ($)</label>
                            <input
                                type="number"
                                value={formData.basePrice}
                                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                                step="0.01"
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Quantum (Stock)</label>
                            <input
                                type="number"
                                value={formData.stockQuantity}
                                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                                className="w-full px-5 py-4 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Visual Asset</label>
                        <div className="border-2 border-dashed border-divider rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 hover:border-primary transition-all cursor-pointer group bg-surface/30">
                            <div className="w-16 h-16 rounded-3xl bg-white group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all shadow-sm">
                                <Plus />
                            </div>
                            <div className="text-center">
                                <p className="text-xs font-black text-text-primary uppercase tracking-tight">Deploy visual interface</p>
                                <p className="text-[10px] text-text-hint font-bold mt-1">PNG, JPG or WEBP (MAX. 800x400px)</p>
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
                        onClick={handleSubmit}
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
