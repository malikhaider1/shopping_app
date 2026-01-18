import {
    Settings,
    Globe,
    CreditCard,
    Truck,
    Mail,
    Lock,
    ChevronRight
} from 'lucide-react';

import { motion } from 'framer-motion';

export const SettingsPage = () => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-4xl space-y-10"
        >
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-text-primary">Settings</h2>
                <p className="text-text-secondary">Configure your store's global preferences and secure integrations.</p>
            </div>

            <div className="grid gap-6">
                {[
                    { icon: Globe, label: 'Store Information', desc: 'Name, logo, branding, and contact details', color: 'text-blue-500 bg-blue-50/50' },
                    { icon: CreditCard, label: 'Payments & Checkout', desc: 'Manage Stripe, PayPal and custom COD settings', color: 'text-indigo-500 bg-indigo-50/50' },
                    { icon: Truck, label: 'Fulfillment & Logistics', desc: 'Shipping zones, rates and automated courier rules', color: 'text-emerald-500 bg-emerald-50/50' },
                    { icon: Mail, label: 'Communication Hub', desc: 'SMTP settings and branded transactional templates', color: 'text-amber-500 bg-amber-50/50' },
                    { icon: Lock, label: 'Access Control', desc: 'Manage team roles, permissions and API credentials', color: 'text-rose-500 bg-rose-50/50' },
                ].map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.label}
                        className="p-6 bg-white border border-divider rounded-2xl flex items-center justify-between group cursor-pointer hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                    >
                        <div className="flex items-center gap-6">
                            <div className={`p-4 rounded-2xl ${item.color} ring-1 ring-divider ring-inset group-hover:ring-primary/20 transition-all group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/5`}>
                                <item.icon size={24} />
                            </div>
                            <div>
                                <h4 className="font-black text-text-primary group-hover:text-primary transition-colors">{item.label}</h4>
                                <p className="text-xs font-medium text-text-hint mt-1 uppercase tracking-widest">{item.desc}</p>
                            </div>
                        </div>
                        <div className="p-2 text-text-hint group-hover:text-primary transition-all group-hover:translate-x-1">
                            <ChevronRight size={20} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-primary p-12 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl shadow-primary/30">
                <div className="relative z-10 flex items-center justify-between">
                    <div className="space-y-4">
                        <h3 className="text-3xl font-black tracking-tight">Enterprise Support</h3>
                        <p className="text-white/60 text-sm max-w-sm font-bold leading-relaxed">Need assistance with high-volume scaling or custom logic? Our engineering team is here to help you 24/7.</p>
                        <button className="px-8 py-4 bg-white text-primary font-black rounded-xl hover:bg-surface transition-all flex items-center gap-3 shadow-xl active:scale-95 group/btn">
                            <Settings size={20} className="group-hover/btn:rotate-180 transition-transform duration-700" />
                            DOCK DOCUMENTATION
                        </button>
                    </div>
                    <Settings className="absolute -right-16 -bottom-16 w-80 h-80 text-white/5 animate-spin-slow group-hover:text-white/10 transition-colors" />
                </div>
            </div>
        </motion.div>
    );
};
