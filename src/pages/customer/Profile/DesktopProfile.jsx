import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DesktopProfile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        username: 'Pelanggan',
        role: 'user',
        email: '',
        phone: '',
        address: '',
        points: 0,
        avatar_url: null
    });
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [tempEmail, setTempEmail] = useState('');
    const [tempPhone, setTempPhone] = useState('');
    const [tempAddress, setTempAddress] = useState('');

    // Security Form
    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await authFetch(`${API_URL}/api/user/profile`);
            const result = await response.json();
            if (result.message === 'success') {
                setUserData(result.data);
                setTempEmail(result.data.email || '');
                setTempPhone(result.data.phone || '');
                setTempAddress(result.data.address || '');
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                body: JSON.stringify({
                    email: tempEmail,
                    phone: tempPhone,
                    address: tempAddress
                })
            });
            if (response.ok) {
                setUserData({ ...userData, email: tempEmail, phone: tempPhone, address: tempAddress });
                toast.success('Profil berhasil diperbarui!');
            }
        } catch (error) {
            toast.error('Gagal memperbarui profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!securityData.currentPassword || !securityData.newPassword) {
            toast.error('Semua field password harus diisi');
            return;
        }
        if (securityData.newPassword !== securityData.confirmPassword) {
            toast.error('Konfirmasi password tidak cocok');
            return;
        }

        setIsLoading(true);
        try {
            const response = await authFetch(`${API_URL}/api/user/profile/password`, {
                method: 'PUT',
                body: JSON.stringify({
                    currentPassword: securityData.currentPassword,
                    newPassword: securityData.newPassword
                })
            });
            const result = await response.json();
            if (response.ok) {
                toast.success('Password berhasil diubah!');
                setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(result.error || 'Gagal mengubah password');
            }
        } catch (error) {
            toast.error('Gagal mengubah password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        navigate('/login');
    };

    const tabs = [
        { id: 'profile', label: 'Informasi Personal', icon: 'User' },
        { id: 'security', label: 'Keamanan Akun', icon: 'Shield' },
        { id: 'orders', label: 'Riwayat Pesanan', icon: 'ShoppingBag', action: () => navigate('/customer/order-confirmation') },
        { id: 'points', label: 'Poin & Hadiah', icon: 'Gift', action: () => navigate('/customer/points-history') }
    ];

    return (
        <div className="min-h-screen bg-transparent pb-12">
            <main className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-12 gap-8">
                {/* Sidebar Navigation */}
                <aside className="col-span-3 relative">
                    <div className="fixed top-28 w-[calc(1280px*3/12-2rem)] max-w-[280px] space-y-6">
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 text-center">
                            <div className="w-24 h-24 bg-gradient-to-tr from-green-600 to-emerald-400 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl font-black shadow-xl shadow-green-600/20 relative group overflow-hidden">
                                {userData.avatar_url ? (
                                    <img src={`${API_URL}${userData.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    userData.username.charAt(0).toUpperCase()
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Icon name="Camera" className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">{userData.username}</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">ID Pelanggan: #{userData.id || '---'}</p>

                            <div className="bg-green-50 dark:bg-green-900/30 rounded-3xl p-5 border border-green-100 dark:border-green-800/50">
                                <span className="block text-[10px] text-green-600 font-black uppercase tracking-widest mb-1">Loyalty Points</span>
                                <span className="text-2xl font-black text-green-600">{new Intl.NumberFormat('id-ID').format(userData.points || 0)}</span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-4 shadow-sm border border-slate-100 dark:border-slate-800">
                            <div className="space-y-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => tab.action ? tab.action() : setActiveTab(tab.id)}
                                        className={`w-full text-left px-5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-tight transition-all flex items-center gap-4 group ${activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Icon name={tab.icon} className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110 text-slate-400'}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                                <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-4 mx-4" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-5 py-3.5 rounded-2xl font-black text-sm uppercase tracking-tight text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-all flex items-center gap-4 group"
                                >
                                    <Icon name="LogOut" className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                    <span>Keluar Akun</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Content Area */}
                <div className="col-span-9">
                    <AnimatePresence mode="wait">
                        {activeTab === 'profile' && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4 mb-10 border-b border-slate-50 dark:border-slate-800 pb-6">
                                        <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/20">
                                            <Icon name="User" className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Informasi Personal</h3>
                                            <p className="text-slate-400 text-sm font-medium">Ubah email, nomor telepon, dan alamat pengiriman Anda.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nama Lengkap</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    disabled
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-3xl py-4 px-6 text-slate-400 font-bold opacity-70"
                                                    value={userData.username}
                                                />
                                                <Icon name="Lock" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-4">Alamat Email</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-3xl py-4 px-6 text-slate-700 dark:text-white font-bold transition-all outline-none"
                                                    value={tempEmail}
                                                    onChange={(e) => setTempEmail(e.target.value)}
                                                />
                                                <Icon name="Mail" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-4">Nomor Telepon</label>
                                            <div className="relative">
                                                <input
                                                    type="tel"
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-3xl py-4 px-6 text-slate-700 dark:text-white font-bold transition-all outline-none"
                                                    value={tempPhone}
                                                    onChange={(e) => setTempPhone(e.target.value)}
                                                />
                                                <Icon name="Phone" className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            </div>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-4">Alamat Pengiriman</label>
                                            <div className="relative">
                                                <textarea
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-3xl p-6 text-slate-700 dark:text-white font-bold transition-all outline-none min-h-[120px]"
                                                    value={tempAddress}
                                                    onChange={(e) => setTempAddress(e.target.value)}
                                                />
                                                <Icon name="MapPin" className="absolute right-6 bottom-6 w-5 h-5 text-slate-300" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 flex justify-end">
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={isLoading}
                                            className="bg-green-600 text-white font-black px-12 py-5 rounded-[2rem] shadow-xl shadow-green-600/20 hover:bg-green-700 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {isLoading ? <Icon name="Loader2" className="w-5 h-5 animate-spin" /> : <Icon name="Check" className="w-5 h-5" />}
                                            SIMPAN PERUBAHAN
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'security' && (
                            <motion.div
                                key="security"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6"
                            >
                                <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-sm border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-4 mb-10 border-b border-slate-50 dark:border-slate-800 pb-6">
                                        <div className="bg-green-600 p-3 rounded-2xl shadow-lg shadow-green-600/20">
                                            <Icon name="Shield" className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Keamanan Akun</h3>
                                            <p className="text-slate-400 text-sm font-medium">Lindungi akun Anda dengan password yang kuat.</p>
                                        </div>
                                    </div>

                                    <div className="max-w-2xl space-y-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-4">Password Saat Ini</label>
                                            <div className="relative">
                                                <input
                                                    type={showPasswords.current ? "text" : "password"}
                                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-3xl py-4 px-6 text-slate-700 dark:text-white font-bold transition-all outline-none"
                                                    value={securityData.currentPassword}
                                                    onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                                />
                                                <button onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                                                    <Icon name={showPasswords.current ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-4">Password Baru</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.new ? "text" : "password"}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-3xl py-4 px-6 text-slate-700 dark:text-white font-bold transition-all outline-none"
                                                        value={securityData.newPassword}
                                                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                                    />
                                                    <button onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                                                        <Icon name={showPasswords.new ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-4">Konfirmasi Password</label>
                                                <div className="relative">
                                                    <input
                                                        type={showPasswords.confirm ? "text" : "password"}
                                                        className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-slate-900 rounded-3xl py-4 px-6 text-slate-700 dark:text-white font-bold transition-all outline-none"
                                                        value={securityData.confirmPassword}
                                                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                                    />
                                                    <button onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                                                        <Icon name={showPasswords.confirm ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleChangePassword}
                                            disabled={isLoading}
                                            className="w-full bg-slate-900 dark:bg-slate-800 text-white font-black py-5 rounded-[2rem] shadow-xl hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {isLoading ? <Icon name="Loader2" className="w-5 h-5 animate-spin" /> : <Icon name="Key" className="w-5 h-5" />}
                                            PERBARUI KATA SANDI
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default DesktopProfile;
