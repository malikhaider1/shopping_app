import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Layers,
    Image as ImageIcon,
    Ticket,
    Star,
    Bell,
    Settings,
    Users,
    LogOut,
    Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Package, label: 'Products', path: '/products' },
    { icon: Layers, label: 'Categories', path: '/categories' },
    { icon: ShoppingCart, label: 'Orders', path: '/orders' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: ImageIcon, label: 'Banners', path: '/banners' },
    { icon: Ticket, label: 'Coupons', path: '/coupons' },
    { icon: Star, label: 'Reviews', path: '/reviews' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-72 h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800 flex flex-col fixed left-0 top-0 z-50 shadow-2xl">
            {/* Logo Section */}
            <div className="p-6 flex items-center gap-4 border-b border-white/5">
                <div className="relative">
                    <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/10">
                        <Zap className="w-5 h-5 text-neutral-900" strokeWidth={2.5} />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-neutral-900 animate-pulse" />
                </div>
                <div>
                    <h1 className="text-lg font-black text-white tracking-tight">ShopAdmin</h1>
                    <p className="text-[10px] font-medium text-neutral-500 uppercase tracking-widest">Command Center</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1 scrollbar-hide">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                            isActive
                                ? "bg-white text-neutral-900 shadow-lg shadow-white/10 font-bold"
                                : "text-neutral-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={18} className={cn(
                                    "transition-all duration-300",
                                    isActive ? "drop-shadow-sm" : "group-hover:scale-110"
                                )} />
                                <span className="text-xs uppercase tracking-wide font-semibold">{item.label}</span>
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-neutral-900 shadow-sm" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-neutral-900 text-sm font-black shadow-lg">
                            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-neutral-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin User'}</p>
                        <p className="text-[10px] text-neutral-500 truncate">{user?.email || 'admin@example.com'}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Sign Out"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};
