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
    Users
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

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

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut } from 'lucide-react';

export const Sidebar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="w-64 h-screen bg-surface border-r border-divider flex flex-col fixed left-0 top-0 z-50">
            <div className="p-8 border-b border-divider flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20">S</div>
                <h1 className="text-lg font-black tracking-tighter text-text-primary">ADMIN <span className="text-primary">CORE</span></h1>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 scrollbar-hide">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group",
                            isActive
                                ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                                : "text-text-hint hover:bg-divider/50 hover:text-primary hover:px-5"
                        )}
                    >
                        <item.icon size={18} className={cn("transition-transform group-hover:scale-110", item.path === '/' ? "" : "")} />
                        <span className="font-black text-[10px] uppercase tracking-[0.15em]">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-6 border-t border-divider bg-surface/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-black ring-4 ring-primary/10">
                            {user?.name?.charAt(0) || 'AD'}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-text-primary uppercase tracking-tight">{user?.name || 'Admin Master'}</span>
                            <span className="text-[10px] font-bold text-text-hint truncate w-24">{user?.email || 'master@admin.com'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-text-hint hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all active:scale-95"
                        title="Sign Out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
