import {
    Settings,
    Globe,
    CreditCard,
    Truck,
    Mail,
    Lock,
    ChevronRight,
    Construction
} from 'lucide-react';

import { motion } from 'framer-motion';
import { useState } from 'react';

export const SettingsPage = () => {
    const [notification, setNotification] = useState<string | null>(null);

    const handleSettingClick = (label: string) => {
        setNotification(`${label} settings are coming soon!`);
        setTimeout(() => setNotification(null), 3000);
    };

    const settingsItems = [
        { icon: Globe, label: 'Store Information', desc: 'Name, logo, and contact details', color: 'text-blue-500 bg-blue-50' },
        { icon: CreditCard, label: 'Payment Methods', desc: 'Stripe, PayPal, and COD settings', color: 'text-indigo-500 bg-indigo-50' },
        { icon: Truck, label: 'Shipping', desc: 'Shipping zones and delivery rates', color: 'text-emerald-500 bg-emerald-50' },
        { icon: Mail, label: 'Email Settings', desc: 'SMTP and email templates', color: 'text-amber-500 bg-amber-50' },
        { icon: Lock, label: 'Access & Security', desc: 'Team roles and API keys', color: 'text-rose-500 bg-rose-50' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl space-y-8"
        >
            {/* Notification Toast */}
            {notification && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-20 right-8 z-50 flex items-center gap-3 px-5 py-4 bg-neutral-900 text-white rounded-xl shadow-xl"
                >
                    <Construction size={18} className="text-amber-400" />
                    <span className="text-sm font-medium">{notification}</span>
                </motion.div>
            )}

            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-neutral-900">Settings</h2>
                <p className="text-neutral-500">Configure your store preferences</p>
            </div>

            {/* Settings Grid */}
            <div className="grid gap-4">
                {settingsItems.map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.label}
                        onClick={() => handleSettingClick(item.label)}
                        className="p-5 bg-white border border-neutral-100 rounded-xl flex items-center justify-between group cursor-pointer hover:border-neutral-300 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                                <item.icon size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-neutral-900 group-hover:text-neutral-700 transition-colors">{item.label}</h4>
                                <p className="text-sm text-neutral-500 mt-0.5">{item.desc}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-1 rounded-md group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">Coming Soon</span>
                            <ChevronRight size={18} className="text-neutral-400 group-hover:text-neutral-600 group-hover:translate-x-1 transition-all" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Support Card */}
            <div className="bg-neutral-900 p-8 rounded-2xl text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-xl font-bold">Need Help?</h3>
                    <p className="text-neutral-400 text-sm mt-2 max-w-sm">Contact our support team for assistance with your store configuration.</p>
                    <a
                        href="mailto:support@ionicerrrrscode.com"
                        className="mt-4 inline-block px-5 py-2.5 bg-white text-neutral-900 font-semibold text-sm rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        Contact Support
                    </a>
                </div>
                <Settings className="absolute -right-8 -bottom-8 w-40 h-40 text-white/5" />
            </div>
        </motion.div>
    );
};
