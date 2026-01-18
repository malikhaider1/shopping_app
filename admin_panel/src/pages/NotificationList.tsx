import { useState } from 'react';
import {
    Send,
    Bell,
    Target,
    Clock,
    Search,
    TrendingUp,
    Loader2,
    Zap,
    Users,
    Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { format } from 'date-fns';

interface Notification {
    id: string;
    title: string;
    body: string;
    notificationType: string;
    data?: Record<string, any>;
    userId?: string | null;
    sentAt: string;
    isRead: boolean;
}

export const NotificationList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        body: '',
        segment: 'all'
    });

    // Fetch notification history
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: async () => {
            const res = await api.get('/admin/notifications', {
                params: { page: 1, limit: 50 }
            });
            return res.data;
        }
    });

    // Send notification mutation
    const sendMutation = useMutation({
        mutationFn: async (data: { title: string; body: string; segment: string }) => {
            return api.post('/admin/notifications/send', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            setFormData({ title: '', body: '', segment: 'all' });
        },
        onError: (error: any) => {
            alert(error.response?.data?.error?.message || 'Failed to send notification');
        }
    });

    const handleBroadcast = async (e: React.FormEvent) => {
        e.preventDefault();
        sendMutation.mutate({
            title: formData.title,
            body: formData.body,
            segment: formData.segment
        });
    };

    const notifications: Notification[] = notificationsData?.data || [];

    const filteredNotifications = notifications.filter(ntf =>
        ntf.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ntf.body.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTargetLabel = (ntf: Notification) => {
        if (ntf.userId) return 'Targeted User';
        return 'All Users';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Broadcast Core</h2>
                    <p className="text-text-secondary font-medium">Deploy push notifications and manage audience engagement streams.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-divider rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-divider bg-surface/30 flex items-center justify-between">
                            <h3 className="font-black text-text-primary flex items-center gap-3 uppercase text-[10px] tracking-[0.2em]">
                                <Clock size={16} className="text-primary" />
                                Transmission Ledger
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search history..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 bg-white border border-divider rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all w-56"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-divider/50">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-4">
                                    <Loader2 className="animate-spin text-primary" size={40} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Loading Transmission Ledger...</p>
                                </div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="text-center py-24">
                                    <Bell className="mx-auto mb-4 text-text-hint/30" size={48} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">No Transmissions Found</p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {filteredNotifications.map((ntf, idx) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={ntf.id}
                                            className="p-8 hover:bg-surface/30 transition-all group border-l-4 border-l-transparent hover:border-l-primary"
                                        >
                                            <div className="flex items-start justify-between mb-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="p-4 rounded-2xl border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100">
                                                        <Bell size={22} />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-text-primary group-hover:text-primary transition-colors uppercase tracking-tight text-[13px]">{ntf.title}</h4>
                                                        <p className="text-xs font-bold text-text-secondary line-clamp-1 mt-1">{ntf.body}</p>
                                                    </div>
                                                </div>
                                                <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-100">
                                                    Delivered
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-divider/50 text-[9px] font-black text-text-hint uppercase tracking-[0.2em]">
                                                <div className="flex items-center gap-8">
                                                    <div className="flex items-center gap-2">
                                                        <Target size={14} className="text-primary" />
                                                        <span className="text-text-secondary">{getTargetLabel(ntf)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-primary" />
                                                        <span className="text-text-secondary">
                                                            {format(new Date(ntf.sentAt), 'MMM dd, yyyy h:mm a')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-primary bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/10">
                                                    <TrendingUp size={14} />
                                                    <span className="tracking-widest">{ntf.notificationType.toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white border border-divider rounded-[2rem] p-8 shadow-sm group">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-text-primary mb-8 flex items-center gap-3">
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                <Megaphone size={18} />
                            </div>
                            Rapid Deployment
                        </h3>
                        <form onSubmit={handleBroadcast} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-text-hint uppercase tracking-widest ml-1">Signal Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Flash Sale Alert!"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    className="w-full px-5 py-3.5 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-text-hint uppercase tracking-widest ml-1">Payload Content</label>
                                <textarea
                                    rows={4}
                                    placeholder="Describe the offer or announcement..."
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all resize-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-text-hint uppercase tracking-widest ml-1">Target Segment</label>
                                <div className="relative">
                                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                                    <select
                                        value={formData.segment}
                                        onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
                                        className="w-full pl-12 pr-4 py-3.5 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="registered">Registered Users Only</option>
                                        <option value="guests">Guest Users Only</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                disabled={sendMutation.isPending}
                                className="w-full py-4 bg-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 mt-4 shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                            >
                                {sendMutation.isPending ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Transmitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        Deploy Signal
                                    </>
                                )}
                            </button>
                            {sendMutation.isSuccess && (
                                <p className="text-xs text-emerald-600 font-bold text-center">Notification sent successfully!</p>
                            )}
                        </form>
                    </div>

                    <div className="bg-primary text-white rounded-[2rem] p-8 shadow-2xl shadow-primary/30 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap size={24} className="text-emerald-400" />
                                <h3 className="font-black text-lg uppercase tracking-tight">Gateway Status</h3>
                            </div>
                            <div className="flex items-center gap-3 text-emerald-400 text-[10px] font-black tracking-[0.2em] uppercase">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                                OneSignal Protocol Active
                            </div>
                            <p className="text-[10px] text-white/50 mt-6 leading-relaxed font-bold uppercase tracking-widest">
                                Real-time messaging gateway operational. All broadcast systems nominal.
                            </p>
                        </div>
                        <Target className="absolute -right-16 -bottom-16 text-white/5 group-hover:scale-110 group-hover:text-white/10 transition-all duration-1000" size={220} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
