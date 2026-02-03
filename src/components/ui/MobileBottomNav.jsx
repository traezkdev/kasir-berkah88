import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../AppIcon';

const MobileBottomNav = ({ items }) => {
    const location = useLocation();
    const currentPath = location.pathname;

    const defaultItems = [
        { path: '/main-dashboard', icon: 'LayoutDashboard', label: 'Home' },
        { path: '/transaksi', icon: 'ShoppingCart', label: 'Jual' },
        { path: '/menu-management', icon: 'UtensilsCrossed', label: 'Menu' },
        { path: '/expense-tracking', icon: 'Receipt', label: 'Catat' },
        { path: '/transaction-history', icon: 'ListOrdered', label: 'Rekap' },
    ];

    const navItems = items || defaultItems;

    const isActiveRoute = (path) => {
        // Special case for Home/Main Dashboard to match root path
        if (path === '/main-dashboard' && currentPath === '/') return true;
        // Exact match or starts with for sub-routes if needed, but snippet implies exact or close match
        return currentPath === path;
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-[#0f172a] border-t border-gray-100 dark:border-slate-800 safe-area-bottom shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <nav className="flex items-center justify-between h-[4.5rem] px-4 py-2">
                {navItems.map((item) => {
                    const active = isActiveRoute(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center justify-center transition-[flex,background-color,color,transform] duration-300 ease-out h-12 rounded-2xl relative group active:scale-90 will-change-[flex,transform]
                      ${active
                                    ? 'flex-[2.5] bg-blue-600 dark:bg-white text-white dark:text-slate-900 px-4 shadow-md shadow-blue-500/20 dark:shadow-white/5 hover:brightness-110'
                                    : 'flex-1 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-2 relative z-10">
                                <Icon
                                    name={item.icon}
                                    size={24}
                                    className={`transition-colors duration-200 ${active ? 'text-white dark:text-slate-900' : 'text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}
                                />
                                {active && (
                                    <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap animate-in fade-in slide-in-from-left-1 duration-300">
                                        {item.label}
                                    </span>
                                )}
                            </div>

                            {/* Adaptive Glassy Overlay */}
                            {active && (
                                <div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-black/5 transition-opacity group-hover:opacity-20" />
                            )}
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
};

export default MobileBottomNav;
