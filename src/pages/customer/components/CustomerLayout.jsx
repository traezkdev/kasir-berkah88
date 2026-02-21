import React from 'react';
import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import PopupDisplay from './PopupDisplay';
import { useCart } from '../context/CartContext';
import { useChat } from '../../../contexts/ChatContext';

const CustomerLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;
    const { cartCount } = useCart();
    const { unreadCount } = useChat();
    const [userName, setUserName] = React.useState('Pelanggan');

    React.useEffect(() => {
        const storedName = localStorage.getItem('username');
        if (storedName) setUserName(storedName);
    }, []);

    const navItems = [
        { path: '/customer/dashboard', icon: 'Home', label: 'Beranda' },
        { path: '/customer/menu', icon: 'Search', label: 'Cari' },
        { path: '/customer/promo', icon: 'Ticket', label: 'Promo', isSpecial: true },
        { path: '/customer/order-confirmation', icon: 'ClipboardList', label: 'Pesanan' },
        { path: '/customer/profile', icon: 'User', label: 'Profil' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans">
            <PopupDisplay />

            {/* Desktop Navigation Top Bar - Premium Glassmorphism */}
            <nav className="hidden lg:block sticky top-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link to="/customer/dashboard" className="flex items-center gap-2 group">
                            <div className="bg-green-600 p-2 rounded-xl group-hover:rotate-12 transition-transform">
                                <Icon name="Coffee" className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">BERKAH<span className="text-green-600">88</span></span>
                        </Link>

                        <div className="flex items-center gap-1 text-[13px] uppercase tracking-widest font-black">
                            {navItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`px-4 py-2 transition-colors ${currentPath === item.path ? 'text-green-600' : 'text-slate-500 hover:text-green-600'}`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Search Bar Desktop Shortcut */}
                        <div onClick={() => navigate('/customer/menu')} className="w-80 bg-slate-100 dark:bg-slate-800 rounded-2xl py-2 px-4 flex items-center gap-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-600 group">
                            <Icon name="Search" className="w-4 h-4 text-slate-400 group-hover:text-green-600 transition-colors" />
                            <span className="text-slate-400 text-sm font-medium">Cari sesuatu yang lezat...</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Link to="/customer/chat" className="p-2.5 text-slate-500 hover:text-green-600 dark:text-slate-400 dark:hover:text-green-400 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all relative">
                                <Icon name="MessageCircle" className="w-5 h-5" />
                                {unreadCount > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>}
                            </Link>
                            <Link to="/customer/cart" className="flex items-center gap-2 p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95">
                                <Icon name="ShoppingCart" className="w-5 h-5" />
                                {cartCount > 0 && <span className="font-black text-sm tracking-tighter">{cartCount} Item</span>}
                            </Link>

                            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />

                            <Link to="/customer/profile" className="flex items-center gap-3 group">
                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 font-black group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                    {userName.charAt(0).toUpperCase()}
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className={`w-full max-w-md lg:max-w-7xl mx-auto min-h-screen relative overflow-x-hidden ${currentPath !== '/customer/chat' && currentPath !== '/customer/cart' ? 'pb-24 lg:pb-12' : ''}`}>
                <Outlet />
            </main>

            {/* Bottom Navigation - Hidden on Desktop */}
            {currentPath !== '/customer/chat' && currentPath !== '/customer/cart' && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 h-[75px] pb-[env(safe-area-inset-bottom)] lg:hidden">
                    <div className="max-w-md mx-auto h-full px-4 pt-3 pb-[15px]">
                        <div className="flex justify-between items-center h-full gap-1">
                            {navItems.map((item) => {
                                const isActive = currentPath === item.path;

                                if (item.isSpecial) {
                                    return (
                                        <Link
                                            key={item.path}
                                            to={item.path}
                                            className="flex-1 flex flex-col items-center justify-center gap-1.5 -mt-6"
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
                    </div>
                </nav>
            )}
        </div>
    );
};

export default CustomerLayout;
