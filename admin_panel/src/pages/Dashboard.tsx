import {
    TrendingUp,
    Users,
    ShoppingCart,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    MoreHorizontal
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
            change: '+12.5%',
            trend: 'up',
            icon: TrendingUp,
            gradient: 'from-emerald-500 to-emerald-600',
            bgLight: 'bg-emerald-50'
        },
        {
            label: 'Customers',
            value: statsData ? statsData.totalUsers.toLocaleString() : '0',
            change: '+5.2%',
            trend: 'up',
            icon: Users,
            gradient: 'from-blue-500 to-blue-600',
            bgLight: 'bg-blue-50'
        },
        {
            label: 'Orders',
            value: statsData ? statsData.totalOrders.toLocaleString() : '0',
            change: statsData ? `${statsData.ordersByStatus?.placed || 0} pending` : '0 pending',
            trend: 'up',
            icon: ShoppingCart,
            gradient: 'from-violet-500 to-violet-600',
            bgLight: 'bg-violet-50'
        },
        {
            label: 'Products',
            value: statsData ? statsData.totalProducts.toLocaleString() : '0',
            change: statsData ? `${statsData.lowStockProducts || 0} low stock` : '0 low stock',
            trend: statsData?.lowStockProducts > 0 ? 'down' : 'up',
            icon: Package,
            gradient: 'from-amber-500 to-amber-600',
            bgLight: 'bg-amber-50'
        },
    ];

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Header */}
            <motion.div variants={item} className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-900">Dashboard</h2>
                    <p className="text-neutral-500 text-sm">Welcome back! Here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-semibold ring-1 ring-emerald-100">
                    <Activity size={14} className="animate-pulse" />
                    Live
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <motion.div
                        variants={item}
                        key={stat.label}
                        className="relative p-6 bg-white rounded-2xl border border-neutral-100 hover:border-neutral-200 hover:shadow-lg transition-all duration-300 group overflow-hidden"
                    >
                        {/* Gradient accent line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />

                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bgLight} group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} className={`text-neutral-700`} />
                            </div>
                            <button className="p-1 text-neutral-400 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal size={16} />
                            </button>
                        </div>

                        <div>
                            <p className="text-sm text-neutral-500 font-medium mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                            <div className="flex items-center gap-1.5 mt-2">
                                {stat.trend === 'up' ? (
                                    <ArrowUpRight className="text-emerald-500" size={14} />
                                ) : (
                                    <ArrowDownRight className="text-rose-500" size={14} />
                                )}
                                <span className={`text-xs font-semibold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tables Section */}
            <div className="grid gap-6 lg:grid-cols-5">
                {/* Recent Orders */}
                <motion.div variants={item} className="lg:col-span-3 bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                    <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-neutral-900">Recent Orders</h3>
                            <p className="text-sm text-neutral-500">Latest customer transactions</p>
                        </div>
                        <button className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors">
                            View All
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 text-neutral-500 text-xs font-medium">
                                <tr>
                                    <th className="px-6 py-3 text-left">Order</th>
                                    <th className="px-6 py-3 text-left">Customer</th>
                                    <th className="px-6 py-3 text-left">Status</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {recentOrders?.map((order: any) => (
                                    <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-neutral-900 text-sm">#{order.orderNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 text-xs font-semibold">
                                                    {order.user?.name?.charAt(0) || 'G'}
                                                </div>
                                                <span className="text-sm text-neutral-600">{order.user?.name || 'Guest'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                                                    order.status === 'cancelled' ? 'bg-rose-50 text-rose-700' :
                                                        order.status === 'shipped' ? 'bg-blue-50 text-blue-700' :
                                                            'bg-amber-50 text-amber-700'
                                                }`}>
                                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-semibold text-neutral-900 text-sm">
                                            ${order.totalAmount.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Top Products */}
                <motion.div variants={item} className="lg:col-span-2 bg-white rounded-2xl border border-neutral-100 p-6">
                    <div className="mb-6">
                        <h3 className="font-semibold text-neutral-900">Top Products</h3>
                        <p className="text-sm text-neutral-500">Best selling items</p>
                    </div>
                    <div className="space-y-4">
                        {topProducts?.map((product: any, index: number) => (
                            <div key={product.productId} className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 font-semibold text-sm group-hover:bg-neutral-900 group-hover:text-white transition-colors">
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 truncate">{product.productName}</p>
                                    <p className="text-xs text-neutral-500">{product.totalQuantity} sold</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-neutral-900">${product.totalRevenue.toFixed(0)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
