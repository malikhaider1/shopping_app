import { useState } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    Calendar,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { AddBannerModal } from '../components/admin/AddBannerModal.tsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

export const BannerList = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState<any>(null);

    const { data: bannersData, isLoading } = useQuery({
        queryKey: ['admin-banners'],
        queryFn: async () => {
            const res = await api.get('/admin/banners');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/admin/banners/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
        }
    });

    const handleEdit = (banner: any) => {
        setSelectedBanner(banner);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedBanner(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to terminate this promotional asset?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Promotional Core</h2>
                    <p className="text-text-secondary font-medium">Manage homepage visual announcements and promotional sliders.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/10 active:scale-95"
                >
                    <Plus size={20} />
                    Deploy Promo Node
                </button>
            </div>

            <AddBannerModal
                isOpen={isModalOpen}
                banner={selectedBanner}
                onClose={() => setIsModalOpen(false)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {isLoading ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-primary" size={40} />
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Synchronizing Visual Assets...</p>
                    </div>
                ) : bannersData?.data.map((banner: any) => (
                    <motion.div
                        whileHover={{ y: -8 }}
                        key={banner.id}
                        className="bg-white border border-divider rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                    >
                        <div className="relative aspect-[21/9] bg-surface overflow-hidden">
                            <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 backdrop-blur-[2px]">
                                <button
                                    onClick={() => handleEdit(banner)}
                                    className="p-4 bg-white rounded-2xl text-primary hover:bg-primary hover:text-white transition-all transform hover:scale-110 active:scale-90 shadow-xl"
                                >
                                    <Edit size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(banner.id)}
                                    className="p-4 bg-white rounded-2xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110 active:scale-90 shadow-xl"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                            <div className="absolute top-6 left-6">
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md ring-1 ring-inset ${banner.isActive
                                        ? 'bg-emerald-500/90 text-white ring-emerald-400'
                                        : 'bg-neutral-500/90 text-white ring-neutral-400'
                                    }`}>
                                    {banner.isActive ? 'Live Stream' : 'Hibernating'}
                                </span>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h4 className="font-black text-xl text-text-primary group-hover:text-primary transition-colors uppercase tracking-tight">{banner.title}</h4>
                                    <div className="flex items-center gap-3 text-text-hint text-[9px] font-black uppercase tracking-[0.2em] mt-3">
                                        <ExternalLink size={12} className="text-primary" />
                                        <span className="hover:text-primary cursor-pointer transition-colors truncate max-w-[250px]">{banner.link || 'Internal Route'}</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-[9px] uppercase font-black text-text-hint tracking-widest leading-none">Stack Order</p>
                                    <p className="text-4xl font-black text-primary leading-none mt-2 opacity-10 group-hover:opacity-100 transition-opacity italic">{banner.displayOrder}</p>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-divider flex items-center justify-between">
                                <div className="flex items-center gap-4 bg-surface px-4 py-2 rounded-xl border border-divider/50">
                                    <Calendar size={14} className="text-primary" />
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                        <span>{banner.startDate ? format(new Date(banner.startDate), 'MMM dd, yyyy') : 'No Start'}</span>
                                        <span className="opacity-30">/</span>
                                        <span>{banner.endDate ? format(new Date(banner.endDate), 'MMM dd, yyyy') : 'Indefinite'}</span>
                                    </div>
                                </div>
                                <div className="text-[9px] font-black text-text-hint uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    Operational Node
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}

                <button
                    onClick={handleAdd}
                    className="bg-surface/30 border-2 border-dashed border-divider rounded-[2.5rem] aspect-[21/9] flex flex-col items-center justify-center gap-6 hover:border-primary hover:bg-white group transition-all duration-500"
                >
                    <div className="p-6 bg-white group-hover:bg-primary group-hover:text-white rounded-3xl transition-all group-hover:rotate-90 group-hover:scale-110 shadow-xl shadow-transparent group-hover:shadow-primary/20">
                        <Plus size={32} />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-[0.2em] text-text-hint group-hover:text-primary">Initialize New Node</span>
                </button>
            </div>
        </motion.div>
    );
};
