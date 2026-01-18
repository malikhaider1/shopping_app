import { X, Loader2, Package, Truck, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { format } from 'date-fns';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
}

const statusConfig: Record<string, { label: string, color: string, icon: any }> = {
    placed: { label: 'Placed', color: 'bg-amber-100 text-amber-700 ring-amber-200', icon: Clock },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 ring-blue-200', icon: CheckCircle2 },
    processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700 ring-indigo-200', icon: Package },
    shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-700 ring-purple-200', icon: Truck },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-700 ring-cyan-200', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 ring-emerald-200', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', color: 'bg-rose-100 text-rose-700 ring-rose-200', icon: XCircle },
    returned: { label: 'Returned', color: 'bg-neutral-100 text-neutral-700 ring-neutral-200', icon: Clock },
};

export const OrderDetailsModal = ({ isOpen, onClose, orderId }: OrderDetailsModalProps) => {
    const queryClient = useQueryClient();
    const [statusNotes, setStatusNotes] = useState('');

    const { data: orderResponse, isLoading } = useQuery({
        queryKey: ['admin-order', orderId],
        queryFn: async () => {
            if (!orderId) return null;
            const res = await api.get(`/admin/orders/${orderId}`);
            return res.data;
        },
        enabled: !!orderId && isOpen,
    });

    const statusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            return api.put(`/admin/orders/${orderId}/status`, {
                status: newStatus,
                notes: statusNotes
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
            setStatusNotes('');
        },
    });

    if (!isOpen) return null;

    const order = orderResponse?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-primary/20 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl border border-divider overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-8 border-b border-divider bg-surface/30">
                    <div>
                        <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">
                            Order {order?.orderNumber || '...'}
                        </h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-hint mt-1">
                            Transaction Node ID: {orderId}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 text-text-hint hover:text-primary transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto scrollbar-hide">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Pulling Ledger Data...</p>
                        </div>
                    ) : order ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="p-6 bg-surface rounded-[2rem] border border-divider shadow-sm">
                                        <h4 className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-4">Customer Payload</h4>
                                        <div className="space-y-3">
                                            <p className="font-black text-text-primary text-sm">{order.user?.name || 'Guest User'}</p>
                                            <p className="text-xs font-bold text-text-secondary">{order.user?.email || order.shippingAddress?.email}</p>
                                            <p className="text-xs font-bold text-text-secondary">{order.user?.phone || order.shippingAddress?.phone}</p>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-surface rounded-[2rem] border border-divider shadow-sm">
                                        <h4 className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-4">Shipping Destination</h4>
                                        <div className="space-y-1 text-xs font-bold text-text-secondary">
                                            <p>{order.shippingAddress?.address}</p>
                                            <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                                            <p>{order.shippingAddress?.pincode}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-surface rounded-[2rem] border border-divider shadow-sm">
                                        <h4 className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] mb-4">System Logistics</h4>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">Operational State</span>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ring-1 ring-inset ${statusConfig[order.status]?.color || 'bg-neutral-100 text-neutral-600 ring-neutral-200'}`}>
                                                    {statusConfig[order.status]?.label || order.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">Initialization</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">
                                                    {format(new Date(order.createdAt), 'MMM dd, HH:mm')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-hint">Payment Protocol</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary italic">
                                                    {order.paymentMethod}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 shadow-sm">
                                        <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-4">Financial Payload</h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-text-secondary">
                                                <span>Subtotal</span>
                                                <span>${order.totalAmount - (order.deliveryCharges || 0)}</span>
                                            </div>
                                            <div className="flex justify-between text-xs font-bold text-text-secondary">
                                                <span>Logistics Fee</span>
                                                <span>+${order.deliveryCharges || 0}</span>
                                            </div>
                                            <div className="pt-2 border-t border-primary/10 flex justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Total Remittance</span>
                                                <span className="text-lg font-black text-primary">${order.totalAmount}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em] ml-1">Composition Manifest</h4>
                                <div className="border border-divider rounded-[2rem] overflow-hidden bg-white">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-surface/50 text-text-hint uppercase text-[9px] font-black tracking-[0.2em]">
                                            <tr>
                                                <th className="px-6 py-4">Component</th>
                                                <th className="px-6 py-4 text-center">Unit Count</th>
                                                <th className="px-6 py-4 text-right">Node Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-divider font-bold text-text-secondary">
                                            {order.items?.map((item: any) => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-text-primary uppercase tracking-tight font-black">{item.productName}</span>
                                                            <span className="text-[9px] text-text-hint uppercase tracking-widest mt-0.5">Variant: {item.variantName || 'Base'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-black">×{item.quantity}</td>
                                                    <td className="px-6 py-4 text-right font-black text-text-primary">${item.price}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-8 bg-surface rounded-[2rem] border border-divider shadow-sm space-y-6">
                                <h4 className="text-[10px] font-black text-text-hint uppercase tracking-[0.2em]">Operational Override</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                                        <button
                                            key={st}
                                            disabled={statusMutation.isPending || order.status === st}
                                            onClick={() => statusMutation.mutate(st)}
                                            className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50 ${order.status === st
                                                ? 'bg-primary text-white scale-105 shadow-xl shadow-primary/20'
                                                : 'bg-white border border-divider text-text-hint hover:text-primary hover:border-primary'
                                                }`}
                                        >
                                            {statusMutation.isPending && statusMutation.variables === st ? (
                                                <Loader2 size={12} className="animate-spin mx-auto" />
                                            ) : (
                                                st.replace(/_/g, ' ')
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-text-hint uppercase tracking-widest ml-1">Status Annotation (Notes)</label>
                                    <textarea
                                        value={statusNotes}
                                        onChange={(e) => setStatusNotes(e.target.value)}
                                        placeholder="Add operational notes for this status transition..."
                                        className="w-full px-5 py-4 bg-white rounded-2xl border border-divider focus:ring-4 focus:ring-primary/5 focus:border-primary/20 outline-none font-bold text-xs transition-all resize-none h-24"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-text-hint font-black uppercase text-[10px] tracking-widest">
                            Transaction Node Missing
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-divider bg-surface/50 flex items-center justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center gap-3"
                    >
                        Sync Node Ledger
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
