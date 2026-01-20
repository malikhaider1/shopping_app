import {
    TrendingUp,
    Users,
    ShoppingCart,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

export const Dashboard = () => {
    const { data: statsData } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/dashboard/stats');
            return res.data.data;
        }
    });

    const { data: recentOrders } = useQuery({
        queryKey: ['admin-recent-orders'],
        queryFn: async () => {
            const res = await api.get('/admin/dashboard/orders');
            return res.data.data;
        }
    });

    const { data: topProducts } = useQuery({
        queryKey: ['admin-top-selling'],
        queryFn: async () => {
            const res = await api.get('/admin/dashboard/products/top-selling');
            return res.data.data;
        }
    });

    const stats = [
        {
            label: 'Total Revenue',
            value: statsData ? `$${statsData.totalRevenue.toLocaleString()}` : '$0',
            change: '+12.5%', // Mocked for now as backend doesn't provide historical comparison yet
            trend: 'up',
            icon: TrendingUp,
            color: 'text-blue-600 bg-blue-50'
        },
        {
            label: 'Total Customers',
            value: statsData ? statsData.totalUsers.toLocaleString() : '0',
            change: '+5.2%',
            trend: 'up',
            icon: Users,
            color: 'text-indigo-600 bg-indigo-50'
        },
        {
            label: 'Orders Placed',
            value: statsData ? statsData.totalOrders.toLocaleString() : '0',
            change: statsData ? `${statsData.ordersByStatus.placed || 0} pending` : '0 pending',
            trend: 'up',
            icon: ShoppingCart,
            color: 'text-emerald-600 bg-emerald-50'
        },
        {
            label: 'In Stock',
            value: statsData ? statsData.totalProducts.toLocaleString() : '0',
            change: statsData ? `${statsData.lowStockProducts} low stock` : '0 low stock',
            trend: 'down',
            icon: Package,
            color: 'text-amber-600 bg-amber-50'
        },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-text-primary">Dashboard Overview</h2>
                    <p className="text-text-secondary">Real-time performance metrics and business health.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest ring-1 ring-emerald-100 italic">
                    <Activity size={14} className="animate-pulse" />
                    Live System Feed
                </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <motion.div
                        variants={item}
                        key={stat.label}
                        className="p-8 bg-white border border-divider rounded-3xl hover:shadow-xl hover:shadow-primary/5 transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{stat.label}</span>
                            <div className={`p-4 rounded-2xl ${stat.color} ring-1 ring-divider ring-inset transition-all group-hover:scale-110`}>
                                <stat.icon size={22} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-3xl font-black text-text-primary">{stat.value}</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider mt-2">
                                {stat.trend === 'up' ? (
                                    <ArrowUpRight className="text-emerald-500" size={14} />
                                ) : (
                                    <ArrowDownRight className="text-rose-500" size={14} />
                                )}
                                <span className={stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}>
                                    {stat.change}
                                </span>
                                <span className="text-text-hint opacity-50 ml-1 italic font-bold">Performance Index</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={item} className="lg:col-span-4 bg-white border border-divider rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-divider flex items-center justify-between">
                        <div>
                            <h3 className="font-black text-text-primary uppercase text-[10px] tracking-[0.2em]">Latest Transactions</h3>
                            <p className="text-xs font-bold text-text-hint mt-1">Real-time order processing feed</p>
                        </div>
                        <button className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-neutral-800 transition-all shadow-lg shadow-primary/10">Export Records</button>
                    </div>
                    <div className="flex-1 overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-surface/50 text-text-hint uppercase text-[9px] font-black tracking-[0.2em]">
                                <tr>
                                    <th className="px-8 py-4 border-b border-divider">Entity ID</th>
                                    <th className="px-8 py-4 border-b border-divider">Account</th>
                                    <th className="px-8 py-4 border-b border-divider">Status Node</th>
                                    <th className="px-8 py-4 border-b border-divider text-right">Value (USD)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-divider/50">
                                {recentOrders?.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-surface/30 transition-all group">
                                        <td className="px-8 py-5">
                                            <span className="font-black text-text-primary group-hover:text-primary transition-colors text-[11px] uppercase tracking-tighter">#{order.orderNumber}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary italic font-black text-[10px] uppercase">
                                                    {order.user?.name?.charAt(0) || 'G'}
                                                </div>
                                                <span className="text-xs font-bold text-text-secondary">{order.user?.name || 'Guest User'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' :
                                                order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 ring-rose-100' :
                                                    'bg-blue-50 text-blue-700 ring-blue-100'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right font-black text-text-primary text-[11px]">${order.totalAmount.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                <motion.div variants={item} className="lg:col-span-3 bg-white border border-divider rounded-[2.5rem] shadow-sm p-8 flex flex-col">
                    <div className="mb-8">
                        <h3 className="font-black text-text-primary uppercase text-[10px] tracking-[0.2em]">High Affinity Catalog</h3>
                        <p className="text-xs font-bold text-text-hint mt-1">Products with highest conversion velocity</p>
                    </div>
                    <div className="space-y-6">
                        {topProducts?.map((product: any) => (
                            <div key={product.productId} className="flex items-center gap-5 group cursor-pointer p-4 rounded-3xl hover:bg-surface transition-all">
                                <div className="w-14 h-14 bg-white rounded-2xl border border-divider flex items-center justify-center shadow-sm group-hover:bg-primary group-hover:text-white transition-all overflow-hidden relative ring-4 ring-transparent group-hover:ring-primary/5">
                                    <Package size={22} className="group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-text-primary line-clamp-1 group-hover:text-primary transition-colors tracking-tight uppercase">{product.productName}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-text-hint font-bold uppercase tracking-widest">{product.totalQuantity} Units Transacted</span>
                                        <span className="w-1 h-1 rounded-full bg-divider"></span>
                                        <span className="text-[9px] text-emerald-500 font-black uppercase">Revenue Peak</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-text-primary">${product.totalRevenue.toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
