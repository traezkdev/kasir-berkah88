import React, { useState, useEffect } from 'react';
import authFetch from '../../utils/authFetch';
import LoadingScreen from '../../components/ui/LoadingScreen';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/ToastNotification';
import { useTheme } from '../../contexts/ThemeContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';

const apiUrl = import.meta.env.VITE_API_URL;

const PointLoyalty = () => {
    const { theme } = useTheme();
    const { toggleSidebar } = useAppSettings();
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [customers, setCustomers] = useState([]);
    const [pointSettings, setPointSettings] = useState({
        points_per_item: 100,
        point_system_enabled: '1'
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Top up state
    const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [topUpDescription, setTopUpDescription] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [custRes, settingsRes] = await Promise.all([
                authFetch(`${apiUrl}/api/customers?limit=1000`),
                authFetch(`${apiUrl}/api/point-settings`)
            ]);


            if (custRes.ok) {
                const custData = await custRes.json();
                setCustomers(custData.data || []);
            }

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json();
                setPointSettings(settingsData.data || {
                    points_per_item: 100,
                    point_system_enabled: '1'
                });
            }
        } catch (error) {
            console.error("Error fetching point data:", error);
            showToast("Gagal mengambil data poin", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await authFetch(`${apiUrl}/api/point-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points_per_item: parseInt(pointSettings.points_per_item),
                    point_system_enabled: pointSettings.point_system_enabled === '1'
                })
            });

            if (response.ok) {
                showToast("Pengaturan poin berhasil diperbarui", "success");
            } else {
                showToast("Gagal memperbarui pengaturan", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan jaringan", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        if (!selectedCustomer || !topUpAmount) return;

        setIsSaving(true);
        try {
            const response = await authFetch(`${apiUrl}/api/points/topup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: selectedCustomer.id,
                    amount: parseFloat(topUpAmount),
                    description: topUpDescription
                })
            });

            if (response.ok) {
                showToast(`Poin ${selectedCustomer.username} berhasil ditambah`, "success");
                setIsTopUpModalOpen(false);
                setTopUpAmount('');
                setTopUpDescription('');
                fetchData(); // Refresh data
            } else {
                showToast("Gagal menambah poin", "error");
            }
        } catch (error) {
            showToast("Terjadi kesalahan jaringan", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        (c.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').toString().includes(searchQuery)
    );

    const totalPointsDistributed = customers.reduce((sum, c) => sum + (parseFloat(c.points) || 0), 0);

    if (isLoading) {
        return <LoadingScreen message="Memuat Poin & Loyalitas" submessage="Mengambil data pelanggan dan pengaturan poin" />;
    }

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-gray-50' : 'bg-transparent'}`}>
            {theme === 'default' && (
                <NavigationHeader onToggleSidebar={toggleSidebar} headerTitle="Poin & Loyalitas" />
            )}

            <main className={`${theme === 'default' ? 'pt-24 lg:pt-20' : ''} pb-24 lg:pb-12`}>
                <div className={theme === 'default' ? "max-w-7xl mx-auto px-4 lg:px-8" : "w-full"}>

                    {/* Breadcrumbs & Header */}
                    <div className="mb-8 space-y-4">
                        <BreadcrumbNavigation paths={[
                            { name: 'Dashboard', path: '/main-dashboard' },
                            { name: 'Poin & Loyalitas', path: '/point-loyalty' }
                        ]} />
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tight">Manajemen Poin</h1>
                                <p className="text-gray-500 font-medium">Kelola sistem reward dan loyalitas pelanggan Anda.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-50 px-6 py-4 rounded-[2rem] border border-orange-100 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-200">
                                        <Icon name="Gift" className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Total Poin Beredar</p>
                                        <p className="text-2xl font-black text-gray-900">{Math.floor(totalPointsDistributed).toLocaleString('id-ID')} <span className="text-xs text-gray-400">Poin</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Settings Panel */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className={`bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm sticky transition-all duration-500 z-10 ${theme === 'default' ? 'top-20 lg:top-[4.5rem]' : 'top-0'}`}>
                                <div className="flex items-center gap-3 mb-8">


                                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                        <Icon name="Settings2" size={20} />
                                    </div>
                                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Pengaturan Poin</h2>
                                </div>

                                <form onSubmit={handleUpdateSettings} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Sistem Poin</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setPointSettings({ ...pointSettings, point_system_enabled: '1' })}
                                                className={`py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${pointSettings.point_system_enabled === '1' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
                                            >
                                                <Icon name="CheckCircle2" size={16} /> Aktif
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setPointSettings({ ...pointSettings, point_system_enabled: '0' })}
                                                className={`py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${pointSettings.point_system_enabled === '0' ? 'bg-gray-700 text-white shadow-xl shadow-gray-200' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}
                                            >
                                                <Icon name="XCircle" size={16} /> Mati
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block">Poin Per Menu</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={pointSettings.points_per_item}
                                                onChange={(e) => setPointSettings({ ...pointSettings, points_per_item: e.target.value })}
                                                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl font-black text-xl text-blue-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all pr-16"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-300">Poin</div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Jumlah poin yang didapatkan pelanggan untuk setiap menu yang dibeli.</p>
                                    </div>

                                    <Button type="submit" className="w-full py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20" disabled={isSaving}>
                                        {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                    </Button>
                                </form>

                                <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-3">
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <Icon name="Info" size={16} />
                                        <span className="text-xs font-black uppercase tracking-wider">Informasi</span>
                                    </div>
                                    <p className="text-[11px] text-blue-700/70 font-medium leading-relaxed">
                                        Poin akan diberikan secara otomatis setiap transaksi selesai jika nomor telepon pelanggan terdaftar dalam sistem loyalitas.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer List Panel */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[600px]">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                            <Icon name="Users" size={20} />
                                        </div>
                                        <h2 className="text-xl font-black text-gray-900 tracking-tight">Daftar Loyalitas</h2>
                                    </div>

                                    <div className="relative flex-1 max-w-sm group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                            <Icon name="Search" size={18} />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau telepon..."
                                            className="w-full bg-gray-50 border border-transparent py-3 pl-12 pr-4 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-medium"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="overflow-x-auto -mx-8">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-gray-50">
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pelanggan</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Poin Saat Ini</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {filteredCustomers.length > 0 ? filteredCustomers.map((customer) => (
                                                <tr key={customer.id} className="group hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                                {customer.username ? customer.username.substring(0, 2).toUpperCase() : '??'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900">{customer.name || customer.username}</p>
                                                                <p className="text-xs text-gray-400 font-medium">{customer.phone || 'Tanpa Telepon'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-600 rounded-full font-black text-sm border border-orange-100">
                                                            <Icon name="Star" size={14} fill="currentColor" />
                                                            {Math.floor(customer.points || 0).toLocaleString('id-ID')}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedCustomer(customer);
                                                                setIsTopUpModalOpen(true);
                                                            }}
                                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-blue-600 transition-all shadow-lg shadow-gray-200 hover:shadow-blue-200"
                                                        >
                                                            <Icon name="PlusCircle" size={14} /> Top Up
                                                        </button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="3" className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-30">
                                                            <Icon name="Users2" size={48} />
                                                            <p className="font-bold">Keanggotaan tidak ditemukan</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Top Up Modal */}
            {isTopUpModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] px-4">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="relative p-10">
                            <button
                                onClick={() => setIsTopUpModalOpen(false)}
                                className="absolute right-8 top-8 w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
                            >
                                <Icon name="X" size={20} />
                            </button>

                            <div className="text-center mb-10 space-y-4">
                                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-blue-50">
                                    <Icon name="Gift" size={36} />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 tracking-tight">Manual Top Up</h3>
                                <div className="inline-block px-6 py-2 bg-gray-100 rounded-full text-sm font-bold text-gray-600 uppercase tracking-widest">
                                    Member: {selectedCustomer?.username || selectedCustomer?.name}
                                </div>
                            </div>

                            <form onSubmit={handleTopUp} className="space-y-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-2">Jumlah Poin Baru</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                autoFocus
                                                required
                                                placeholder="Contoh: 500"
                                                className="w-full bg-gray-50 border border-gray-100 p-6 rounded-[2rem] font-black text-3xl text-blue-600 focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all pr-20"
                                                value={topUpAmount}
                                                onChange={(e) => setTopUpAmount(e.target.value)}
                                            />
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-gray-300">POIN</div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 block ml-2">Catatan (Pilihan)</label>
                                        <textarea
                                            placeholder="Hadiah ulang tahun, bonus loyalitas, dll..."
                                            className="w-full bg-gray-50 border border-gray-100 p-6 rounded-[2rem] font-bold text-gray-600 focus:ring-4 focus:ring-blue-500/5 focus:bg-white focus:border-blue-500 outline-none transition-all h-32 resize-none"
                                            value={topUpDescription}
                                            onChange={(e) => setTopUpDescription(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsTopUpModalOpen(false)}
                                        className="flex-1 py-5 rounded-[2rem] font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all border border-gray-100"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-[2] py-5 rounded-[2rem] bg-blue-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Icon name="Loader2" size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Icon name="Zap" size={18} /> Proses Top Up
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PointLoyalty;
