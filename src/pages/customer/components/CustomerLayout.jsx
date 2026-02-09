import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const CustomerLayout = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    const navItems = [
        { path: '/customer/dashboard', icon: 'Home', label: 'Beranda' },
        { path: '/customer/menu', icon: 'Search', label: 'Cari' },
        { path: '/customer/cart', icon: 'ShoppingBag', label: 'Pesanan' },
        { path: '/customer/profile', icon: 'User', label: 'Akun' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Main Content Area */}
            <main className="w-full max-w-md lg:max-w-7xl mx-auto min-h-screen relative overflow-x-hidden pb-20">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            {currentPath !== '/customer/chat' && currentPath !== '/customer/cart' && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 max-w-md mx-auto">
                    <div className="flex justify-around items-center h-16">
                        {navItems.map((item) => {
                            const isActive = currentPath.startsWith(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-full ${isActive ? 'bg-green-50' : ''} transition-all duration-300`}>
                                        <Icon
                                            name={item.icon}
                                            className={`w-6 h-6 ${isActive ? 'fill-current' : 'stroke-2'}`}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-medium mt-0.5 ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
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
