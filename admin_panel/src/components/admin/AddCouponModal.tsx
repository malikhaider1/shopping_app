import { useState, useEffect } from 'react';
import { X, Loader2, Ticket, Percent, DollarSign, Calendar, Hash, Users, Activity } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface AddCouponModalProps {
    isOpen: boolean;
    onClose: () => void;
    coupon?: any;
}

export const AddCouponModal = ({ isOpen, onClose, coupon }: AddCouponModalProps) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        code: '',
        type: 'percentage',
        value: '',
        minOrderAmount: '',
        maxDiscountAmount: '',
        usageLimit: '',
        userLimit: '',
        startDate: '',
        expiryDate: '',
        isActive: true,
    });

    useEffect(() => {
        if (coupon) {
            setFormData({
                code: coupon.code || '',
                type: coupon.type || 'percentage',
                value: coupon.value?.toString() || '',
                minOrderAmount: coupon.minOrderAmount?.toString() || '',
                maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
                usageLimit: coupon.usageLimit?.toString() || '',
                userLimit: coupon.userLimit?.toString() || '1',
                startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
                expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
                isActive: coupon.isActive ?? true,
            });
        } else {
            setFormData({
                code: '',
                type: 'percentage',
                value: '',
                minOrderAmount: '',
                maxDiscountAmount: '',
                usageLimit: '',
                userLimit: '1',
                startDate: new Date().toISOString().split('T')[0],
                expiryDate: '',
                isActive: true,
            });
        }
    }, [coupon, isOpen]);

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (coupon) {
                return api.put(`/admin/coupons/${coupon.id}`, data);
            }
            return api.post('/admin/coupons', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            onClose();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            value: Number(formData.value),
            minOrderAmount: Number(formData.minOrderAmount) || 0,
            maxDiscountAmount: Number(formData.maxDiscountAmount) || null,
            usageLimit: Number(formData.usageLimit) || null,
            userLimit: Number(formData.userLimit) || 1,
            code: formData.code.toUpperCase(),
        };
        mutation.mutate(payload);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-divider overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-divider bg-surface/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary rounded-2xl text-white shadow-xl shadow-primary/20">
                            <Ticket size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                                {coupon ? 'Update Coupon Node' : 'Deploy Discount Protocol'}
                            </h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint mt-1">
                                Configure promotional parameters and validity logic.
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-hint hover:text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Promotional Code</label>
                            <div className="relative">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                                <input
                                    required
                                    type="text"
                                    placeholder="WELCOME20"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all uppercase"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Benefit Model</label>
                            <div className="flex bg-surface p-1 rounded-2xl border border-divider">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'percentage' })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'percentage' ? 'bg-white shadow-sm text-primary ring-1 ring-divider' : 'text-text-hint hover:text-text-primary'}`}
                                >
                                    <Percent size={14} />
                                    Percentage
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'fixed' })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.type === 'fixed' ? 'bg-white shadow-sm text-primary ring-1 ring-divider' : 'text-text-hint hover:text-text-primary'}`}
                                >
                                    <DollarSign size={14} />
                                    Fixed Amount
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Benefit Value</label>
                            <input
                                required
                                type="number"
                                placeholder={formData.type === 'percentage' ? '20' : '500'}
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                className="w-full px-5 py-3.5 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Min Threshold ($)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formData.minOrderAmount}
                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                className="w-full px-5 py-3.5 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Max Ceiling ($)</label>
                            <input
                                type="number"
                                placeholder="Unlimited"
                                value={formData.maxDiscountAmount}
                                onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                                className="w-full px-5 py-3.5 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Global Limit</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                                <input
                                    type="number"
                                    placeholder="Total usage limit"
                                    value={formData.usageLimit}
                                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Activation Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                                <input
                                    required
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all text-text-secondary"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-hint uppercase tracking-widest ml-1">Expiry Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                                <input
                                    required
                                    type="date"
                                    value={formData.expiryDate}
                                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-surface rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-sm transition-all text-text-secondary"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <div className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-divider">
                                <div className="flex items-center gap-3">
                                    <Activity className="text-primary" size={20} />
                                    <div>
                                        <p className="text-[10px] font-black text-text-primary uppercase tracking-widest">Immediate Deployment</p>
                                        <p className="text-[9px] font-bold text-text-hint uppercase mt-0.5">Activate node upon synchronization</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.isActive ? 'bg-primary' : 'bg-divider'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isActive ? 'left-7 shadow-md' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-8 border-t border-divider bg-surface/50 flex items-center justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-text-hint hover:text-text-primary transition-all"
                    >
                        Abort Sync
                    </button>
                    <button
                        disabled={mutation.isPending}
                        onClick={handleSubmit}
                        className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-3 disabled:opacity-50"
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="animate-spin" size={18} />
                                Syncing Ledger...
                            </>
                        ) : (
                            <>
                                Synchronize Protocol
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
