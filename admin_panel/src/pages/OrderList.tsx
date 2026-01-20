import { useState } from 'react';
import {
    Search,
    Download,
    Calendar,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { OrderDetailsModal } from '../components/admin/OrderDetailsModal.tsx';
import { Pagination } from '../components/admin/Pagination.tsx';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string, color: string }> = {
    placed: { label: 'Placed', color: 'bg-amber-100 text-amber-700 ring-amber-200' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 ring-blue-200' },
    processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700 ring-indigo-200' },
    shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700 ring-purple-200' },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-700 ring-cyan-200' },
    delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 ring-emerald-200' },
    cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 ring-rose-200' },
    returned: { label: 'Returned', color: 'bg-neutral-100 text-neutral-700 ring-neutral-200' },
};

export const OrderList = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const limit = 10;

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['admin-orders', page, searchTerm, statusFilter],
        queryFn: async () => {
            const params: any = { page, limit, search: searchTerm };
            if (statusFilter !== 'All') params.status = statusFilter.toLowerCase();
            const res = await api.get('/admin/orders', { params });
            return res.data;
        }
    });

    const handleViewDetails = (id: string) => {
        setSelectedOrderId(id);
        setIsModalOpen(true);
    };

    const handleExport = () => {
        if (!ordersData?.data || ordersData.data.length === 0) {
            alert('No orders to export');
            return;
        }

        const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Payment Status'];
        const csvData = ordersData.data.map((order: any) => [
            order.orderNumber,
            format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm'),
            order.user?.name || 'Guest',
            order.user?.email || 'N/A',
            order.itemsCount,
            order.totalAmount,
            order.status,
            order.paymentStatus
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map((row: any[]) => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Fulfillment Hub</h2>
                    <p className="text-text-secondary font-medium">Coordinate logistics and track customer transaction lifecycles.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="px-6 py-3 border border-divider rounded-2xl flex items-center gap-3 text-[10px] font-black text-text-hint hover:bg-white hover:text-primary transition-all active:scale-95 shadow-sm uppercase tracking-widest">
                        <Calendar size={18} />
                        Historical Range
                    </button>
                    <button
                        onClick={handleExport}
                        className="bg-primary text-white px-8 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/10 active:scale-95"
                    >
                        <Download size={20} />
                        Export Ledger
                    </button>
                </div>
            </div>

            <OrderDetailsModal
                isOpen={isModalOpen}
                orderId={selectedOrderId}
                onClose={() => setIsModalOpen(false)}
            />

            <div className="bg-white border border-divider rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-divider flex flex-wrap gap-6 items-center justify-between bg-surface/30">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                        <input
                            type="text"
                            placeholder="Enter Invoice or Order Number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                        {['All', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-5 py-2 whitespace-nowrap rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all shadow-sm ${statusFilter === status
                                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105'
                                    : 'bg-white border border-divider text-text-hint hover:border-primary hover:text-primary active:scale-95'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                            <Loader2 className="animate-spin text-primary" size={40} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Synchronizing Transaction Nodes...</p>
                        </div>
                    ) : (
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface/50 text-text-hint uppercase text-[9px] font-black tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-5">Order ID</th>
                                    <th className="px-8 py-5">Customer Node</th>
                                    <th className="px-8 py-5">Timestamp</th>
                                    <th className="px-8 py-5">Composition</th>
                                    <th className="px-8 py-5">Financials</th>
                                    <th className="px-8 py-5">Logistics State</th>
                                    <th className="px-8 py-5 text-right">Operational Link</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-divider font-bold text-text-secondary">
                                {ordersData?.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-20 text-center font-black text-text-hint uppercase tracking-widest text-[10px]">
                                            No Transaction Records Found
                                        </td>
                                    </tr>
                                ) : ordersData?.data.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-surface/30 transition-all group">
                                        <td className="px-8 py-5">
                                            <span className="font-black text-text-primary group-hover:text-primary transition-colors text-[11px] uppercase tracking-wider">{order.orderNumber}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-text-primary text-[12px] font-black uppercase tracking-tight">{order.user?.name || 'Guest User'}</span>
                                                <span className="text-[10px] font-bold text-text-hint tracking-wider mt-0.5">{order.user?.email || 'No Email'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-[11px] font-black uppercase tracking-tighter text-text-hint">
                                            {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-surface rounded-lg text-[9px] font-black border border-divider shadow-sm">
                                                {order.itemsCount || 0} UNITS
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-text-primary font-black text-[13px] tracking-tight">
                                            ${order.totalAmount}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${statusConfig[order.status]?.color || 'bg-neutral-100 text-neutral-600 ring-neutral-200'}`}>
                                                {statusConfig[order.status]?.label || order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => handleViewDetails(order.id)}
                                                className="p-2.5 text-text-hint hover:text-primary transition-all flex items-center gap-2 ml-auto hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-divider active:scale-95 group-hover:translate-x-[-4px]"
                                            >
                                                <span className="text-[9px] font-black uppercase tracking-[0.1em]">Analyze Node</span>
                                                <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={ordersData?.meta?.totalPages || 0}
                    totalResults={ordersData?.meta?.total || 0}
                    limit={limit}
                    onPageChange={setPage}
                />
            </div>
        </motion.div>
    );
};
