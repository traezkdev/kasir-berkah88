import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const CustomerLayout = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        { path: '/customer/dashboard', icon: 'Home', label: 'Beranda' },
        { path: '/customer/menu', icon: 'Search', label: 'Cari' },
        { path: '/customer/promo', icon: 'Ticket', label: 'Promo', isSpecial: true },
        { path: '/customer/cart', icon: 'ClipboardList', label: 'Pesanan' },
        { path: '/customer/profile', icon: 'User', label: 'Profil' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Main Content Area */}
            <main className="w-full max-w-md lg:max-w-7xl mx-auto min-h-screen relative overflow-x-hidden pb-24">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            {currentPath !== '/customer/chat' && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 max-w-md mx-auto h-[75px] px-4 pt-3 pb-[15px]">
                    <div className="flex justify-between items-center h-full gap-1">
                        {navItems.map((item) => {
                            const isActive = currentPath === item.path;

                            if (item.isSpecial) {
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className="flex-1 flex flex-col items-center justify-center gap-1.5 -mt-10"
                                    >
                                        <div className={`w-[54px] h-[54px] rounded-[20px] flex items-center justify-center border shadow-lg transition-all duration-300 ${isActive
                                            ? 'bg-green-600 border-green-500 shadow-green-200 scale-110'
                                            : 'bg-green-50 border-green-100 shadow-green-100/50 hover:bg-green-100'
                                            }`}>
                                            <Icon
                                                name={item.icon}
                                                className={`w-6 h-6 ${isActive ? 'text-white' : 'text-green-600'}`}
                                                strokeWidth={2.5}
                                            />
                                        </div>
                                        <span className={`text-[9px] uppercase tracking-wider font-black ${isActive ? 'text-green-600' : 'text-slate-400'}`}>
                                            {item.label}
                                        </span>
                                    </Link>
                                );
                            }

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className="flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-200"
                                >
                                    <Icon
                                        name={item.icon}
                                        className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-slate-400'}`}
                                        strokeWidth={isActive ? 2.5 : 2}
                                    />
                                    <span className={`text-[9px] uppercase tracking-wider ${isActive ? 'font-black text-green-600' : 'font-bold text-slate-400'}`}>
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
};

export default CustomerLayout;
