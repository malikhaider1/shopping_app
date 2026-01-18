import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Bell, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminLayout = () => {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar />
            <div className="ml-64 flex-1 flex flex-col">
                <header className="h-16 border-b border-divider bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-hint" size={18} />
                        <input
                            type="text"
                            placeholder="Search something..."
                            className="w-full pl-10 pr-4 py-2 bg-surface/50 rounded-full border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 text-sm transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="p-2 text-text-secondary hover:text-primary transition-all hover:bg-surface rounded-full relative active:scale-95">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white animate-pulse"></span>
                        </button>
                        <div className="h-8 w-px bg-divider mx-2"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right flex flex-col">
                                <span className="text-xs font-bold text-text-primary leading-tight">Admin Portal</span>
                                <span className="text-[10px] text-text-hint uppercase tracking-wider font-bold">Standard Access</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black">
                                AD
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-8 flex-1 overflow-x-hidden">
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
