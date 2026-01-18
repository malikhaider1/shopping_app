import { useState } from 'react';
import {
    Star,
    Trash2,
    MessageSquare,
    Search,
    CheckCircle2,
    XCircle,
    Loader2,
    Filter,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export const ReviewList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<'All' | 'Pending' | 'Approved'>('All');

    const { data: reviewsData, isLoading } = useQuery({
        queryKey: ['admin-reviews', tab],
        queryFn: async () => {
            const params: any = {};
            if (tab === 'Pending') params.isApproved = false;
            if (tab === 'Approved') params.isApproved = true;
            const res = await api.get('/admin/reviews', { params });
            return res.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.put(`/admin/reviews/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        }
    });

    const rejectMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.put(`/admin/reviews/${id}/reject`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/admin/reviews/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
        }
    });

    const handleApprove = (id: string) => {
        approveMutation.mutate(id);
    };

    const handleReject = (id: string) => {
        if (window.confirm('Are you sure you want to reject this review? It will be permanently deleted.')) {
            rejectMutation.mutate(id);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this review?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredReviews = reviewsData?.data.filter((review: any) => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return review.user?.name?.toLowerCase().includes(term) ||
            review.product?.name?.toLowerCase().includes(term) ||
            review.comment?.toLowerCase().includes(term);
    }) || [];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Sentiment Core</h2>
                    <p className="text-text-secondary font-medium">Moderate customer sentiment and curate authentic feedback streams.</p>
                </div>
            </div>

            <div className="bg-white border border-divider rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-divider bg-surface/30 flex flex-wrap gap-6 items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                        <input
                            type="text"
                            placeholder="Search by customer, product, or keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {['All', 'Pending', 'Approved'].map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t as any)}
                                className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all ${tab === t
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105'
                                    : 'bg-white border border-divider text-text-hint hover:border-primary hover:text-primary'
                                    }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-divider/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Syncing Sentiment Ledger...</p>
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <div className="text-center py-24">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">No Reviews Found in Current Filter</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {filteredReviews.map((review: any) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    key={review.id}
                                    className="p-8 hover:bg-surface/30 transition-all group border-l-4 border-l-transparent hover:border-l-primary"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                                                {review.user?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-text-primary group-hover:text-primary transition-colors uppercase tracking-tight text-[13px]">
                                                    {review.user?.name || 'Anonymous User'}
                                                </h4>
                                                <p className="text-[10px] font-bold text-text-hint uppercase tracking-widest mt-1">
                                                    Reviewed <span className="text-primary">{review.product?.name}</span> • {format(new Date(review.createdAt), 'MMM dd, yyyy')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-accent/5 px-4 py-2 rounded-full border border-accent/10 shadow-sm">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={i < review.rating ? 'fill-accent text-accent' : 'text-text-hint/30'}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pl-[4.5rem]">
                                        <div className="relative">
                                            <MessageSquare className="absolute -left-10 -top-2 text-primary/10" size={32} />
                                            <p className="text-sm font-bold text-text-secondary leading-relaxed bg-surface/50 p-6 rounded-[1.5rem] border border-divider italic">
                                                "{review.comment}"
                                            </p>
                                        </div>

                                        <div className="mt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${review.isApproved
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 animate-pulse-slow'
                                                    : 'bg-amber-50 text-amber-700 ring-amber-100'
                                                    }`}>
                                                    {review.isApproved ? 'Verified Signal' : 'Pending Validation'}
                                                </span>
                                                {!review.isApproved && (
                                                    <div className="flex items-center gap-4">
                                                        <button
                                                            onClick={() => handleApprove(review.id)}
                                                            disabled={approveMutation.isPending}
                                                            className="text-[10px] font-black tracking-widest text-emerald-600 hover:text-emerald-700 uppercase group/btn flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {approveMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                                            Authorize
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(review.id)}
                                                            disabled={rejectMutation.isPending}
                                                            className="text-[10px] font-black tracking-widest text-rose-600 hover:text-rose-700 uppercase group/btn flex items-center gap-2 disabled:opacity-50"
                                                        >
                                                            {rejectMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={14} />}
                                                            Terminate
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    className="p-2.5 text-text-hint hover:text-rose-600 hover:bg-rose-50 border border-divider rounded-xl transition-all shadow-sm active:scale-90"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
