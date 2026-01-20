import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, Search, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminLayout = () => {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-neutral-50">
            <Sidebar />
            <div className="ml-72 flex-1 flex flex-col">
                {/* Enhanced Header */}
                <header className="h-16 bg-white border-b border-neutral-100 sticky top-0 z-10 flex items-center justify-between px-8 shadow-sm">
                    {/* Search Bar */}
                    <div className="relative w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search anything..."
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 rounded-xl text-sm border border-transparent hover:border-neutral-200 focus:border-neutral-300 focus:bg-white transition-all placeholder:text-neutral-400"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-neutral-300">
                            <Command size={12} />
                            <span className="text-[10px] font-medium">K</span>
                        </div>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-3">
                        {/* Notifications */}
                        <button className="relative p-2.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-all active:scale-95">
                            <Bell size={18} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
                        </button>

                        <div className="h-6 w-px bg-neutral-200" />

                        {/* User Badge */}
                        <div className="flex items-center gap-3 pl-2">
                            <div className="text-right">
                                <p className="text-xs font-semibold text-neutral-900">Admin Panel</p>
                                <p className="text-[10px] text-neutral-500 font-medium">Full Access</p>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-neutral-900 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-neutral-900/20">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="p-8 flex-1 overflow-x-hidden bg-neutral-50">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};
