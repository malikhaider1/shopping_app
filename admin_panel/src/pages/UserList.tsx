import { useState } from 'react';
import {
    Search,
    Mail,
    Phone,
    ShieldCheck,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pagination } from '../components/admin/Pagination.tsx';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export const UserList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState<'All' | 'Active' | 'Blocked' | 'Guests'>('All');
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: usersData, isLoading } = useQuery({
        queryKey: ['admin-users', page, searchTerm, tab],
        queryFn: async () => {
            const params: any = { page, limit, search: searchTerm };
            if (tab === 'Active') params.isActive = true;
            if (tab === 'Blocked') params.isActive = false;
            if (tab === 'Guests') params.isGuest = true;
            const res = await api.get('/admin/users', { params });
            return res.data;
        }
    });

    const statusMutation = useMutation({
        mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
            return api.put(`/admin/users/${id}/status`, { isActive });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        }
    });

    const handleToggleStatus = (id: string, currentStatus: boolean) => {
        if (window.confirm(`Are you sure you want to ${currentStatus ? 'suspend' : 'activate'} this identity node?`)) {
            statusMutation.mutate({ id, isActive: !currentStatus });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Identity Core</h2>
                    <p className="text-text-secondary font-medium">Manage user authentication nodes and behavioral permissions.</p>
                </div>
                {/* <button className="bg-primary text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/10 active:scale-95">
                    <UserPlus size={20} />
                    Deploy User Node
                </button> */}
            </div>

            <div className="bg-white border border-divider rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-divider bg-surface/30 flex flex-wrap gap-6 items-center justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or protocol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {['All', 'Active', 'Blocked', 'Guests'].map((t) => (
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

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Syncing Identity Ledger...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface/50 text-text-hint uppercase text-[9px] font-black tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">Identity Node</th>
                                    <th className="px-8 py-5">Access Level</th>
                                    <th className="px-8 py-5">Initialization</th>
                                    <th className="px-8 py-5">Operational State</th>
                                    <th className="px-8 py-5 text-right">Overrides</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-divider font-bold text-text-secondary">
                                {usersData?.data.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-surface/30 transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm overflow-hidden">
                                                    {user.profileImage ? (
                                                        <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        user.name?.charAt(0) || '?'
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-text-primary group-hover:text-primary transition-colors uppercase tracking-tight text-[12px]">{user.name || 'Anonymous User'}</span>
                                                    <div className="flex items-center gap-3 text-[10px] font-bold text-text-hint tracking-wider mt-0.5">
                                                        <span className="flex items-center gap-1.5"><Mail size={12} className="text-primary/50" /> {user.email}</span>
                                                        {user.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-primary/50" /> {user.phone}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${user.isGuest
                                                ? 'bg-amber-50 text-amber-700 ring-amber-100'
                                                : 'bg-indigo-50 text-indigo-700 ring-indigo-100'
                                                }`}>
                                                {user.isGuest ? 'Guest Entry' : 'Verified Member'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-[11px] font-black text-text-hint uppercase tracking-tighter italic">
                                            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse-slow shadow-[0_0_12px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${user.isActive ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                    {user.isActive ? 'Active Node' : 'Suspended'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => handleToggleStatus(user.id, user.isActive)}
                                                    className={`p-2.5 rounded-xl transition-all shadow-sm active:scale-90 ${user.isActive
                                                        ? 'text-rose-600 hover:bg-rose-50 bg-white border border-divider hover:border-rose-100'
                                                        : 'text-emerald-600 hover:bg-emerald-50 bg-white border border-divider hover:border-emerald-100'
                                                        }`}
                                                    title={user.isActive ? 'Suspend User' : 'Activate User'}
                                                >
                                                    {user.isActive ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                                                </button>
                                                {/* <button className="p-2.5 text-text-hint hover:text-primary transition-all bg-white border border-divider rounded-xl shadow-sm hover:shadow-md active:scale-90">
                                                    <MoreVertical size={18} />
                                                </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={usersData?.meta?.totalPages || 0}
                    totalResults={usersData?.meta?.total || 0}
                    limit={limit}
                    onPageChange={setPage}
                />
            </div>
        </motion.div>
    );
};
