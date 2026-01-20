import { useState } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    ChevronDown,
    ChevronRight,
    FolderTree,
    Loader2,
    Power
} from 'lucide-react';
import { AddCategoryModal } from '../components/admin/AddCategoryModal.tsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { motion } from 'framer-motion';

export const CategoryList = () => {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [expanded, setExpanded] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            const res = await api.get('/admin/categories');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/admin/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || error.message || 'Failed to delete category';
            alert(`Error: ${message}`);
        }
    });

    const toggleStatusMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.patch(`/admin/categories/${id}/toggle-status`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
        },
        onError: (error: any) => {
            const message = error.response?.data?.error?.message || error.message || 'Failed to toggle status';
            alert(`Error: ${message}`);
        }
    });

    const handleEdit = (category: any) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to PERMANENTLY DELETE this category? This cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleStatus = async (id: string, isActive: boolean) => {
        const action = isActive ? 'suspend' : 'activate';
        if (window.confirm(`Are you sure you want to ${action} this category?`)) {
            toggleStatusMutation.mutate(id);
        }
    };

    const toggleExpand = (id: string) => {
        setExpanded(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const filteredCategories = categoriesData?.data.filter((cat: any) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">Taxonomy Core</h2>
                    <p className="text-text-secondary font-medium">Manage your classification hierarchy and metadata nodes.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-primary text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/10 active:scale-95"
                >
                    <Plus size={20} />
                    Deploy Classification
                </button>
            </div>

            <AddCategoryModal
                isOpen={isModalOpen}
                category={selectedCategory}
                onClose={() => setIsModalOpen(false)}
            />

            <div className="bg-white border border-divider rounded-[2.5rem] overflow-hidden shadow-sm">
                <div className="p-6 border-b border-divider flex items-center justify-between bg-surface/30">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                        <input
                            type="text"
                            placeholder="Search classifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 text-sm font-bold outline-none transition-all"
                        />
                    </div>
                    <button className="p-3 text-text-hint hover:text-primary transition-colors hover:bg-white rounded-xl shadow-sm border border-divider">
                        <FolderTree size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Syncing Classification Hierarchy...</p>
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">No classification nodes found</p>
                        </div>
                    ) : (
                        filteredCategories.map((category: any) => (
                            <div key={category.id} className="border border-divider rounded-[2rem] overflow-hidden bg-white shadow-sm hover:shadow-md transition-all group">
                                <div
                                    className={`flex items-center justify-between p-6 cursor-pointer hover:bg-surface/50 transition-colors ${expanded.includes(category.id) ? 'bg-surface/30 border-b border-divider' : ''
                                        }`}
                                    onClick={() => toggleExpand(category.id)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-surface border border-divider overflow-hidden flex-shrink-0 group-hover:border-primary/20 transition-all shadow-sm">
                                            <img src={category.imageUrl || 'https://via.placeholder.com/100'} alt={category.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-text-primary uppercase text-xs tracking-tight">
                                                    {category.name}
                                                </h4>
                                                {category.subcategories?.length > 0 && (
                                                    expanded.includes(category.id) ? <ChevronDown size={14} className="text-primary" /> : <ChevronRight size={14} className="text-text-hint" />
                                                )}
                                            </div>
                                            <p className="text-[10px] text-text-hint font-bold uppercase tracking-widest mt-1 italic">/{category.slug} • Priority Node: {category.displayOrder}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${category.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-rose-50 text-rose-700 ring-rose-100'
                                            }`}>
                                            {category.isActive ? 'Active Node' : 'Suspended'}
                                        </span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(category); }}
                                                className="p-2.5 text-text-hint hover:text-primary hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md active:scale-90"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleToggleStatus(category.id, category.isActive); }}
                                                className={`p-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-90 ${category.isActive ? 'text-text-hint hover:text-amber-600 hover:bg-amber-50' : 'text-text-hint hover:text-emerald-600 hover:bg-emerald-50'}`}
                                                title={category.isActive ? 'Suspend' : 'Activate'}
                                            >
                                                <Power size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                                                className="p-2.5 text-text-hint hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-90"
                                                title="Delete permanently"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {category.subcategories?.length > 0 && expanded.includes(category.id) && (
                                    <div className="bg-surface/30 divide-y divide-divider/50 border-t border-divider">
                                        {category.subcategories.map((sub: any) => (
                                            <div key={sub.id} className="flex items-center justify-between py-4 pl-24 pr-8 hover:bg-white transition-colors group/sub">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[11px] font-black uppercase text-text-secondary group-hover/sub:text-primary transition-colors tracking-tight">{sub.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ring-1 ring-inset ${sub.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-rose-50 text-rose-700 ring-rose-100'}`}>
                                                        {sub.isActive ? 'Active' : 'Suspended'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex items-center gap-2 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEdit(sub)}
                                                            className="p-1.5 text-text-hint hover:text-primary transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(sub.id, sub.isActive)}
                                                            className={`p-1.5 transition-colors ${sub.isActive ? 'text-text-hint hover:text-amber-600' : 'text-text-hint hover:text-emerald-600'}`}
                                                            title={sub.isActive ? 'Suspend' : 'Activate'}
                                                        >
                                                            <Power size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(sub.id)}
                                                            className="p-1.5 text-text-hint hover:text-rose-600 transition-colors"
                                                            title="Delete permanently"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
};
