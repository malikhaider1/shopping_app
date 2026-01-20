import { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    ArrowUpDown,
    Loader2
} from 'lucide-react';
import { AddProductModal } from '../components/admin/AddProductModal.tsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { motion } from 'framer-motion';
import { Pagination } from '../components/admin/Pagination.tsx';

export const ProductList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [page, setPage] = useState(1);
    const limit = 10;

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['admin-products', page, searchTerm],
        queryFn: async () => {
            const res = await api.get('/admin/products', {
                params: { page, limit, search: searchTerm }
            });
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/admin/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || error.message || 'Failed to delete product';
            alert(`Error: ${message}`);
        }
    });

    const handleEdit = (product: any) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to decommission this catalog entity? This action is irreversible.')) {
            deleteMutation.mutate(id);
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
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Inventory Core</h2>
                    <p className="text-text-secondary font-medium">Manage your high-affinity product catalog and stock nodes.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/10 active:scale-95"
                >
                    <Plus size={18} />
                    Deploy Entity
                </button>
            </div>

            <AddProductModal
                isOpen={isModalOpen}
                product={selectedProduct}
                onClose={() => setIsModalOpen(false)}
            />

            <div className="bg-white border border-divider rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-divider flex flex-wrap gap-4 items-center justify-between bg-surface/30">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                        <input
                            type="text"
                            placeholder="Search entities by name or SKU..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold outline-none transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="px-5 py-3 border border-divider rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-white hover:text-primary transition-all">
                            <Filter size={16} />
                            Filter Nodes
                        </button>
                        <button className="px-5 py-3 border border-divider rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:bg-white hover:text-primary transition-all">
                            <ArrowUpDown size={16} />
                            Sort Order
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-surface/50 text-text-hint uppercase text-[9px] font-black tracking-[0.2em]">
                            <tr>
                                <th className="px-8 py-5 border-b border-divider">Entity Mapping</th>
                                <th className="px-8 py-5 border-b border-divider">SKU Code</th>
                                <th className="px-8 py-5 border-b border-divider text-right">Valuation</th>
                                <th className="px-8 py-5 border-b border-divider text-center">Quantum</th>
                                <th className="px-8 py-5 border-b border-divider">Operational Status</th>
                                <th className="px-8 py-5 border-b border-divider text-right">Command</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-divider/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <Loader2 className="animate-spin text-primary" size={32} />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Synchronizing with Database...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : productsData?.data.map((product: any) => (
                                <tr key={product.id} className="hover:bg-surface/30 transition-all group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-divider overflow-hidden flex-shrink-0 group-hover:border-primary/20 transition-all shadow-sm">
                                                <img
                                                    src={product.mainImage || 'https://via.placeholder.com/100'}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-text-primary group-hover:text-primary transition-colors text-[11px] uppercase tracking-tight">{product.name}</span>
                                                <span className="text-[9px] text-text-hint font-bold uppercase mt-0.5 tracking-wider">{product.categoryName || 'General Catalog'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 font-mono text-[10px] text-text-secondary font-bold tracking-tighter uppercase">{product.sku}</td>
                                    <td className="px-8 py-5 text-right font-black text-text-primary text-[11px] italic">${product.basePrice.toFixed(2)}</td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="text-[10px] font-black text-text-secondary">{product.stockQuantity}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${product.stockQuantity > 20
                                            ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                            : product.stockQuantity > 0
                                                ? 'bg-amber-50 text-amber-700 ring-amber-100'
                                                : 'bg-rose-50 text-rose-700 ring-rose-100'
                                            }`}>
                                            {product.stockQuantity > 20 ? 'Optimal' : product.stockQuantity > 0 ? 'Critical' : 'Depleted'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="p-2.5 text-text-hint hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md active:scale-90"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="p-2.5 text-text-hint hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-90"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={productsData?.meta?.totalPages || 0}
                    totalResults={productsData?.meta?.total || 0}
                    limit={limit}
                    onPageChange={setPage}
                />
            </div>
        </motion.div>
    );
};
