import { useState } from 'react';
import {
    Plus,
    Ticket,
    Copy,
    Trash2,
    Edit,
    Search,
    Loader2,
    Calendar,
    Zap
} from 'lucide-react';
import { AddCouponModal } from '../components/admin/AddCouponModal.tsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export const CouponList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<any>(null);

    const { data: couponsData, isLoading } = useQuery({
        queryKey: ['admin-coupons', searchTerm],
        queryFn: async () => {
            const res = await api.get('/admin/coupons', {
                params: { search: searchTerm }
            });
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/admin/coupons/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
        }
    });

    const handleEdit = (coupon: any) => {
        setSelectedCoupon(coupon);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCoupon(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to decommission this promotional code?')) {
            deleteMutation.mutate(id);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Optional: Add a toast notification here
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Promotional Core</h2>
                    <p className="text-text-secondary font-medium">Engineer and supervise discount protocols and redemption logic.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/10 active:scale-95"
                >
                    <Plus size={20} />
                    Deploy Promotion
                </button>
            </div>

            <AddCouponModal
                isOpen={isModalOpen}
                coupon={selectedCoupon}
                onClose={() => setIsModalOpen(false)}
            />

            <div className="bg-white border border-divider rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-divider bg-surface/30 flex items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                        <input
                            type="text"
                            placeholder="Search promotional codes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="p-8">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Pulling Promotional Ledger...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {couponsData?.data.map((coupon: any) => (
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        key={coupon.id}
                                        className="bg-white border border-divider rounded-[2rem] overflow-hidden relative group shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                                    >
                                        <div className={`h-2.5 w-full transition-colors duration-500 ${coupon.isActive ? 'bg-primary' : 'bg-text-hint/30'}`} />
                                        <div className="p-8">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="p-4 bg-surface rounded-[1.25rem] border border-divider group-hover:border-primary/20 transition-all duration-500 shadow-sm">
                                                    <Ticket className="text-primary" size={24} />
                                                </div>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => handleEdit(coupon)}
                                                        className="p-2.5 text-text-hint hover:text-primary hover:bg-white border border-divider rounded-xl transition-all shadow-sm active:scale-90"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(coupon.id)}
                                                        className="p-2.5 text-text-hint hover:text-rose-600 hover:bg-rose-50 border border-divider rounded-xl transition-all shadow-sm active:scale-90"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="flex items-center justify-between group/code">
                                                    <span className="text-3xl font-black text-text-primary tracking-tighter uppercase group-hover/code:text-primary transition-colors duration-500">{coupon.code}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(coupon.code)}
                                                        className="p-2 text-text-hint hover:text-primary transition-all active:scale-125"
                                                    >
                                                        <Copy size={20} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-divider border-dashed">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-text-hint uppercase tracking-[0.2em] mb-1">Payload Benefit</span>
                                                        <span className="text-2xl font-black text-primary">
                                                            {coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`} <span className="text-[10px] uppercase tracking-widest text-text-hint">OFF</span>
                                                        </span>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end">
                                                        <span className="text-[9px] font-black text-text-hint uppercase tracking-[0.2em] mb-1">Redemptions</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-12 bg-divider rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary"
                                                                    style={{ width: `${Math.min((coupon.usageCount || 0) / (coupon.usageLimit || 1) * 100, 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs font-black text-text-primary">{(coupon.usageCount || 0)} / {coupon.usageLimit || '∞'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-3">
                                                        <Calendar size={14} className="text-text-hint" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[9px] font-black text-text-hint uppercase tracking-[0.2em]">Expiration</span>
                                                            <span className="text-[10px] font-black text-text-secondary uppercase tracking-tight">{format(new Date(coupon.expiryDate), 'MMM dd, yyyy')}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${coupon.isActive
                                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 shadow-sm animate-pulse-slow'
                                                            : 'bg-neutral-50 text-neutral-400 ring-neutral-100 shadow-none'
                                                            }`}>
                                                            {coupon.isActive ? 'Active Protocol' : 'Inactive Protocol'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Ticket cutout effect */}
                                        <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-5 h-10 bg-background border-r border-y border-divider rounded-r-full group-hover:scale-y-125 transition-all duration-500" />
                                        <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-5 h-10 bg-background border-l border-y border-divider rounded-l-full group-hover:scale-y-125 transition-all duration-500" />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
