import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { jwtDecode } from 'jwt-decode';

const SellerLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUserRole(decodedToken.role);
            } catch (e) {
                console.error("Error decoding token in SellerLayout:", e);
            }
        }
    }, []);

    const menuItems = [
        { name: 'Dashboard', path: '/seller/dashboard', icon: 'LayoutDashboard', label: 'Dashboard' },
        { name: 'Pesanan', path: '/seller/orders', icon: 'ShoppingBag', label: 'Pesanan' },
        { name: 'Transaksi', path: '/seller/transactions', icon: 'ShoppingCart', label: 'Jual' },
        { name: 'Menu', path: '/seller/menu-management', icon: 'Utensils', label: 'Katalog' },
        { name: 'Riwayat', path: '/seller/transaction-history', icon: 'History', label: 'Transaksi' },
        { name: 'Banner', path: '/seller/banners', icon: 'Image', label: 'Banner' },
        { name: 'Promo', path: '/seller/promos', icon: 'Ticket', label: 'Promo' },
        { name: 'Poin', path: '/point-loyalty', icon: 'Gift', label: 'Loyalty' },
    ];


    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar Desktop (Fixed) */}
            <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-gray-100 shadow-sm fixed h-full z-40 transition-all duration-300">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
                            <Icon name="Store" className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-black text-xl text-gray-800 tracking-tighter">SellerCenter</span>
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Management</span>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {userRole === 'admin' && (
                            <Link
                                to="/main-dashboard"
                                className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all duration-300 mb-6 group border border-indigo-100"
                            >
                                <Icon name="ArrowLeft" className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                <span className="font-black tracking-tight">Kembali ke Admin</span>
                            </Link>
                        )}
                        {menuItems.map((item) => {
                            const isActive = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive
                                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 translate-x-1'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-blue-600'
                                        }`}
                                >
                                    <Icon
                                        name={item.icon}
                                        className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`}
                                    />
                                    <span className="font-bold tracking-tight">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-8">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl text-red-500 hover:bg-red-50 transition-all duration-300 w-full group"
                    >
                        <div className="bg-red-50 p-2 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
                            <Icon name="LogOut" className="w-5 h-5" />
                        </div>
                        <span className="font-bold">Keluar Akun</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 lg:ml-72 min-h-screen pb-24 lg:pb-0 relative overflow-x-hidden">
                <div className="p-4 lg:p-10 max-w-6xl mx-auto overflow-x-hidden">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation Mobile (Native App Style) */}
            {currentPath !== '/seller/receipt' && (
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-50 px-6 pb-safe">
                    <div className="flex justify-around items-center h-20">
                        {menuItems.slice(0, 5).map((item) => {
                            const isActive = currentPath === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`flex flex-col items-center justify-center flex-1 transition-all duration-300 ${isActive ? 'text-blue-600' : 'text-gray-400'
                                        }`}
                                >
                                    <div className={`relative px-6 py-1.5 rounded-2xl transition-all duration-500 ${isActive ? 'bg-blue-50 scale-110' : ''
                                        }`}>
                                        <Icon
                                            name={item.icon}
                                            className={`w-6 h-6 transition-all duration-300 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'
                                                }`}
                                        />
                                        {isActive && (
                                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-black mt-1 uppercase tracking-tighter transition-all duration-300 ${isActive ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-0.5'
                                        }`}>
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

export default SellerLayout;
