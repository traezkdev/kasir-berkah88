import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authFetch from '../../utils/authFetch';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import LoadingScreen from '../../components/ui/LoadingScreen';
import { useToast } from '../../components/ui/ToastNotification';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;

const CustomerManagement = () => {
    const { theme } = useTheme();
    const { toggleSidebar } = useAppSettings();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchCustomers = useCallback(async (isRefresh = false) => {
        if (!isRefresh) setIsLoading(true);
        try {
            const response = await authFetch(`${apiUrl}/api/customers?search=${searchQuery}&limit=1000`);
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.data || []);
            } else {
                showToast('Gagal memuat data pelanggan', 'error');
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            showToast('Terjadi kesalahan jaringan', 'error');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [searchQuery, showToast]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchCustomers]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchCustomers(true);
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(val || 0);
    };

    const handleChat = (customer) => {
        // We set the active chat and navigate
        // Since we are in the website version, we check the Routes for chat
        navigate('/admin/chat', { state: { selectedUser: customer } });
    };

    if (isLoading && !isRefreshing && customers.length === 0) {
        return <LoadingScreen message="Memuat Data Pelanggan" submessage="Mengambil profil dan statistik belanja pelanggan" />;
    }

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'}`}>
            {theme === 'default' && (
                <NavigationHeader onToggleSidebar={toggleSidebar} headerTitle="Manajemen Pelanggan" />
            )}

            <main className={`${theme === 'default' ? 'pt-24 lg:pt-20' : ''} pb-24 lg:pb-12 h-full`}>
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-8" : "w-full p-4 lg:p-6"}>

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                        <div className="space-y-4">
                            <BreadcrumbNavigation paths={[
                                { name: 'Dashboard', path: '/main-dashboard' },
                                { name: 'Pelanggan', path: '/customer-management' }
                            ]} />
                            <div className="space-y-1">
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Manajemen Pelanggan</h1>
                                <p className="text-gray-500 font-medium max-w-md">Pantau profil, riwayat transaksi, dan poin loyalitas pelanggan Anda.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative w-full md:w-80 group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Icon name="Search" size={20} />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Cari nama atau no. HP..."
                                    className="w-full bg-white border border-gray-200 py-3 pl-12 pr-4 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none text-gray-700 font-medium"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="secondary"
                                className="!rounded-2xl !p-3 bg-white border border-gray-200"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                            >
                                <Icon name="RefreshCw" size={20} className={isRefreshing ? 'animate-spin' : ''} />
                            </Button>
                        </div>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                <Icon name="Users" size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Pelanggan</p>
                                <p className="text-xl font-black text-gray-900">{customers.length}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Icon name="ShoppingCart" size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Order</p>
                                <p className="text-xl font-black text-gray-900">{customers.reduce((acc, curr) => acc + (curr.total_orders || 0), 0)}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                <Icon name="Coins" size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Poin</p>
                                <p className="text-xl font-black text-gray-900">{Math.floor(customers.reduce((acc, curr) => acc + (parseFloat(curr.points) || 0), 0)).toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                                <Icon name="Banknote" size={24} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Belanja</p>
                                <p className="text-lg font-black text-gray-900">{formatCurrency(customers.reduce((acc, curr) => acc + (parseFloat(curr.total_spent) || 0), 0))}</p>
                            </div>
                        </div>
                    </div>

                    {/* Customer Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {customers.length > 0 ? customers.map((customer) => (
                            <div
                                key={customer.id}
                                className="bg-white group rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-100 transition-all duration-300 relative overflow-hidden flex flex-col"
                            >
                                {/* Header Card */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-200">
                                        {(customer.username || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-black text-gray-900 truncate">{customer.username}</h3>
                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Icon name="Phone" size={10} />
                                                <span className="text-[10px] font-bold">{customer.phone || 'No Phone'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Icon name="Mail" size={10} />
                                                <span className="text-[10px] font-bold truncate max-w-[150px]">{customer.email || 'Email belum diatur'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 flex items-center gap-1.5">
                                        <Icon name="Coins" size={12} className="text-amber-500" />
                                        <span className="text-xs font-black text-amber-600">{Math.floor(customer.points || 0).toLocaleString('id-ID')}</span>
                                    </div>
                                </div>

                                {/* Address Section */}
                                {customer.address && (
                                    <div className="mb-4 bg-gray-50 p-3 rounded-xl flex items-start gap-2">
                                        <Icon name="MapPin" size={14} className="text-gray-400 mt-0.5" />
                                        <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic truncate">{customer.address}</p>
                                    </div>
                                )}

                                <div className="h-px bg-gray-100 w-full mb-4"></div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Belanja</p>
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                            <Icon name="ShoppingBag" size={12} />
                                            <span className="text-xs font-black">{formatCurrency(customer.total_spent)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Jumlah Order</p>
                                        <div className="flex items-center gap-1.5 text-gray-700">
                                            <Icon name="Receipt" size={12} />
                                            <span className="text-xs font-black">{customer.total_orders || 0} Kali</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto flex items-center gap-2">
                                    <button
                                        onClick={() => handleChat(customer)}
                                        className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Icon name="MessageCircle" size={14} /> Chat
                                    </button>
                                    <button
                                        onClick={() => navigate(`/point-loyalty?search=${customer.username}`)}
                                        className="px-3 py-2.5 bg-gray-50 text-gray-400 rounded-xl hover:bg-amber-50 hover:text-amber-600 border border-gray-100 hover:border-amber-200 transition-all group"
                                        title="Manajemen Poin"
                                    >
                                        <Icon name="Gift" size={16} className="group-hover:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 py-20 text-center space-y-4">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <Icon name="User" size={48} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Pelanggan Tidak Ditemukan</h3>
                                <p className="text-gray-500 font-medium">Belum ada pelanggan yang terdaftar atau coba kata kunci lain.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomerManagement;
