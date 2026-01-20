import {
    Globe,
    CreditCard,
    Truck,
    Mail,
    Lock,
    Save,
    Loader2,
    CheckCircle2,
    Store
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../lib/api';

export const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState('Store Information');
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const { data: settingsData, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const res = await api.get('/admin/settings');
            return res.data;
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: any[]) => {
            return api.put('/admin/settings', payload);
        },
        onSuccess: () => {
            setSuccessMessage('Settings updated successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        }
    });

    useEffect(() => {
        if (settingsData?.data) {
            const initialData: Record<string, string> = {};
            settingsData.data.forEach((s: any) => {
                initialData[s.key] = s.value;
            });
            setFormData(initialData);
        }
    }, [settingsData]);

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        const groupMapping: Record<string, string> = {
            'Store Information': 'store',
            'Payment Methods': 'payment',
            'Shipping': 'shipping',
            'Email Settings': 'email',
            'Access & Security': 'security'
        };

        const payload = Object.entries(formData).map(([key, value]) => ({
            key,
            value,
            group: groupMapping[activeTab] || 'store'
        }));

        updateMutation.mutate(payload);
    };

    const settingsItems = [
        { icon: Globe, label: 'Store Information', desc: 'Name, logo, and contact details', group: 'store' },
        { icon: CreditCard, label: 'Payment Methods', desc: 'Stripe, PayPal, and COD settings', group: 'payment' },
        { icon: Truck, label: 'Shipping', desc: 'Shipping zones and delivery rates', group: 'shipping' },
        { icon: Mail, label: 'Email Settings', desc: 'SMTP and email templates', group: 'email' },
        { icon: Lock, label: 'Access & Security', desc: 'Team roles and API keys', group: 'security' },
    ];

    const renderForm = () => {
        switch (activeTab) {
            case 'Store Information':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Store Name" value={formData['store_name'] || ''} onChange={(v) => handleChange('store_name', v)} placeholder="My Awesome Store" />
                            <InputField label="Support Email" value={formData['support_email'] || ''} onChange={(v) => handleChange('support_email', v)} placeholder="support@example.com" />
                            <InputField label="Contact Phone" value={formData['contact_phone'] || ''} onChange={(v) => handleChange('contact_phone', v)} placeholder="+1 234 567 890" />
                            <InputField label="Currency" value={formData['currency'] || ''} onChange={(v) => handleChange('currency', v)} placeholder="USD" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-1">Store Address</label>
                            <textarea
                                value={formData['store_address'] || ''}
                                onChange={(e) => handleChange('store_address', e.target.value)}
                                className="w-full px-5 py-4 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all resize-none"
                                rows={3}
                                placeholder="123 Shopping St, Mall City, 54321"
                            />
                        </div>
                    </div>
                );
            case 'Payment Methods':
                return (
                    <div className="space-y-6">
                        <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] flex items-center gap-4">
                            <div className="p-4 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-200">
                                <CreditCard size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-indigo-900 text-sm uppercase tracking-tight">Active Gateways</h4>
                                <p className="text-[10px] font-bold text-indigo-700/70 uppercase tracking-widest mt-0.5">Stripe Protocol Active • PayPal Standby</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Stripe Public Key" value={formData['stripe_pub_key'] || ''} onChange={(v) => handleChange('stripe_pub_key', v)} placeholder="pk_test_..." />
                            <InputField label="Stripe Secret Key" value={formData['stripe_secret_key'] || ''} onChange={(v) => handleChange('stripe_secret_key', v)} type="password" />
                            <InputField label="PayPal Client ID" value={formData['paypal_client_id'] || ''} onChange={(v) => handleChange('paypal_client_id', v)} placeholder="AQ..." />
                        </div>
                    </div>
                );
            case 'Shipping':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField label="Free Shipping Threshold" value={formData['free_ship_threshold'] || ''} onChange={(v) => handleChange('free_ship_threshold', v)} placeholder="50.00" />
                            <InputField label="Standard Shipping Rate" value={formData['standard_ship_rate'] || ''} onChange={(v) => handleChange('standard_ship_rate', v)} placeholder="5.99" />
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 bg-surface/50 rounded-[3rem] border-2 border-dashed border-divider">
                        <div className="p-6 bg-white rounded-full shadow-sm mb-4">
                            <Store className="text-text-hint" size={32} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Advanced configuration required for {activeTab}</p>
                    </div>
                );
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
                    <h2 className="text-3xl font-black tracking-tight text-text-primary uppercase tracking-tighter">System Configuration</h2>
                    <p className="text-text-secondary font-medium">Fine-tune your store's operational parameters and secure protocols.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="bg-primary text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                >
                    {updateMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Commit Changes
                </button>
            </div>

            <AnimatePresence>
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm"
                    >
                        <CheckCircle2 size={18} />
                        {successMessage}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Tabs Sidebar */}
                <div className="lg:col-span-4 space-y-3">
                    {settingsItems.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setActiveTab(item.label)}
                            className={`w-full p-6 rounded-[2rem] flex items-center gap-5 transition-all group relative overflow-hidden ${activeTab === item.label
                                ? 'bg-white border-2 border-primary shadow-xl shadow-primary/5'
                                : 'bg-white/50 border border-divider hover:border-primary/30'
                                }`}
                        >
                            {activeTab === item.label && (
                                <motion.div layoutId="setting-active" className="absolute left-0 w-2 h-full bg-primary" />
                            )}
                            <div className={`p-3.5 rounded-2xl transition-all ${activeTab === item.label
                                ? 'bg-primary text-white'
                                : 'bg-surface text-text-hint group-hover:bg-primary/10 group-hover:text-primary'
                                }`}>
                                <item.icon size={20} />
                            </div>
                            <div className="text-left">
                                <h4 className={`font-black uppercase tracking-tight text-[11px] ${activeTab === item.label ? 'text-primary' : 'text-text-primary'
                                    }`}>
                                    {item.label}
                                </h4>
                                <p className="text-[9px] font-bold text-text-hint mt-0.5 uppercase tracking-wider">{item.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-8">
                    <div className="bg-white border border-divider rounded-[3rem] p-10 shadow-sm relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="animate-spin text-primary" size={40} />
                                <p className="text-[10px] font-black uppercase tracking-widest text-text-hint">Pulling Protocol Data...</p>
                            </div>
                        ) : (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mb-10 pb-6 border-b border-divider">
                                    <h3 className="text-xl font-black text-text-primary uppercase tracking-tight">{activeTab}</h3>
                                    <p className="text-xs font-bold text-text-hint mt-1 uppercase tracking-widest">Update your store's globally visible constants.</p>
                                </div>
                                {renderForm()}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const InputField = ({ label, value, onChange, placeholder, type = 'text' }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-text-hint ml-1">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-5 py-4 bg-surface border border-divider rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-mono"
        />
    </div>
);
