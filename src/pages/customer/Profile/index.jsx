import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-hot-toast';

const CustomerProfile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        username: 'Pelanggan',
        role: 'user',
        phone: '',
        address: '',
        points: 0,
        avatar_url: null
    });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedSoundId, setSelectedSoundId] = useState(localStorage.getItem('notificationSound') || 'default');
    const NOTIFICATION_SOUNDS = [
        { id: 'default', name: 'Standard Chime' },
        { id: 'bell', name: 'Reception Bell' },
        { id: 'modern', name: 'Digital Alert' },
        { id: 'urgent', name: 'Triple Beep' },
        { id: 'zte', name: 'ZTE Alert' }
    ];

    const changeNotificationSound = (soundId) => {
        setSelectedSoundId(soundId);
        localStorage.setItem('notificationSound', soundId);
        toast.success(`Suara notifikasi diatur ke: ${soundId}`);

        // Optional: Play a preview sound on web if needed
        // const audio = new Audio(`/sounds/${soundId}.mp3`);
        // audio.play().catch(() => {});
    };

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
    const [tempAddress, setTempAddress] = useState('');
    const [tempPhone, setTempPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [notifSettings, setNotifSettings] = useState({
        orders: true,
        chat: true,
        promo: false
    });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    useEffect(() => {
        fetchProfile();
        fetchNotificationSettings();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.message === 'success') {
                setUserData(result.data);
                setTempAddress(result.data.address || '');
                setTempPhone(result.data.phone || '');
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const fetchNotificationSettings = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const response = await fetch(`${API_URL}/api/user/notification-settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.message === 'success') {
                setNotifSettings(result.data);
            }
        } catch (error) {
            console.error('Failed to load notification settings:', error);
        }
    };

    const updateNotificationSettings = async (updated) => {
        const token = localStorage.getItem('token');
        try {
            await fetch(`${API_URL}/api/user/notification-settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updated)
            });
            setNotifSettings(updated);
        } catch (error) {
            toast.error('Gagal menyimpan pengaturan');
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/user/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    phone: tempPhone,
                    address: tempAddress
                })
            });
            if (response.ok) {
                setUserData({ ...userData, address: tempAddress, phone: tempPhone });
                setIsProfileModalOpen(false);
                toast.success('Profil berhasil diperbarui!');
            }
        } catch (error) {
            console.error("Error updating profile:", error);
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
        if (securityData.newPassword.length < 6) {
            toast.error('Password baru minimal 6 karakter');
            return;
        }

        setIsLoading(true);
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_URL}/api/user/profile/password`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: securityData.currentPassword,
                    newPassword: securityData.newPassword
                })
            });

            const result = await response.json();
            if (response.ok) {
                toast.success('Password berhasil diubah!');
                setIsAccountModalOpen(false);
                setSecurityData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                toast.error(result.error || 'Gagal mengubah password');
            }
        } catch (error) {
            console.error("Error changing password:", error);
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

    return (
        <div className="min-h-screen bg-gray-50 pb-10 font-sans relative overflow-x-hidden">
            {/* Fixed Top Section */}
            <div className="fixed top-0 left-0 right-0 z-50 max-w-md mx-auto">
                {/* Header Premium (Dana Look) */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 pb-16 text-white rounded-b-[2.5rem] shadow-lg mb-[-40px]">
                    <h1 className="text-2xl font-black tracking-tight mb-1">Profil Saya</h1>
                    <p className="text-green-100 text-xs font-medium opacity-80 uppercase tracking-widest">Informasi & Pengaturan Akun</p>
                </div>

                <div className="px-5 relative z-10">
                    {/* User Card */}
                    <div className="bg-white p-5 rounded-[2rem] shadow-xl shadow-gray-200/50 flex items-center gap-5 border border-white">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-full flex items-center justify-center shadow-inner border-4 border-white overflow-hidden">
                            {userData.avatar_url ? (
                                <img src={`${API_URL}${userData.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="User" className="w-10 h-10 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="font-black text-xl text-gray-900 tracking-tight">{userData.username}</h3>
                                <div className="bg-green-100 text-green-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm border border-green-200/50">
                                    {userData.role}
                                </div>
                            </div>
                            <p className="text-gray-400 text-sm font-bold tracking-tight">{userData.phone || 'Belum ada nomor HP'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer to push menu list down */}
            <div className="h-[250px]"></div>

            <div className="px-5 space-y-4 relative z-10 mt-2">
                {/* Points Card */}
                {userData.role !== 'admin' && (
                    <div
                        className="bg-white p-5 rounded-[2rem] shadow-xl shadow-gray-200/50 flex items-center gap-4 border border-blue-50 cursor-pointer active:scale-[0.98] transition-all"
                        onClick={() => navigate('/customer/points-history')}
                    >
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <Icon name="Banknote" className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-gray-400 font-bold">Poin Berkah88</p>
                            <p className="text-lg font-black text-blue-600 tracking-tight">{Math.floor(userData.points || 0)} Poin</p>
                        </div>
                        <Icon name="ChevronRight" className="w-5 h-5 text-gray-300" />
                    </div>
                )}

                {/* Menu List */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 overflow-hidden border border-white">
                    {[
                        {
                            icon: 'MapPin',
                            label: 'Alamat Tersimpan',
                            color: 'text-blue-500',
                            bg: 'bg-blue-50',
                            desc: userData.address || 'Klik untuk atur alamat',
                            onClick: () => setIsProfileModalOpen(true)
                        },
                        {
                            icon: 'ShoppingBag',
                            label: 'Status Pesanan',
                            color: 'text-orange-500',
                            bg: 'bg-orange-50',
                            desc: 'Lacak pesanan aktif Anda',
                            onClick: () => navigate('/customer/order-confirmation')
                        },
                        {
                            icon: 'HelpCircle',
                            label: 'Bantuan & Dukungan',
                            color: 'text-amber-500',
                            bg: 'bg-amber-50',
                            desc: 'Pusat bantuan 24/7',
                            onClick: () => navigate('/customer/chat')
                        },
                        {
                            icon: 'Shield',
                            label: 'Keamanan Akun',
                            color: 'text-green-600',
                            bg: 'bg-green-50',
                            desc: 'Ubah password & keamanan',
                            onClick: () => setIsAccountModalOpen(true)
                        },
                        {
                            icon: 'Bell',
                            label: 'Pengaturan Notifikasi',
                            color: 'text-blue-600',
                            bg: 'bg-blue-50',
                            desc: 'Suara & Pemberitahuan',
                            onClick: () => setIsNotifModalOpen(true)
                        }
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            onClick={item.onClick}
                            className={`flex items-center gap-4 p-5 border-b last:border-0 border-gray-50 ${item.onClick ? 'cursor-pointer active:bg-gray-50' : 'opacity-60'} transition-all duration-200 group`}
                        >
                            <div className={`p-3 rounded-2xl group-active:scale-90 transition-transform ${item.bg} ${item.color}`}>
                                <Icon name={item.icon} className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <span className="block font-extrabold text-gray-800 tracking-tight">{item.label}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">{item.desc}</span>
                            </div>
                            <Icon name="ChevronRight" className="w-4 h-4 text-gray-300" />
                        </div>
                    ))}
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full mt-4 bg-red-50 text-red-600 font-black py-4 rounded-[2rem] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-red-100 shadow-lg shadow-red-100/50"
                >
                    <div className="bg-red-500 p-1.5 rounded-lg">
                        <Icon name="LogOut" className="w-5 h-5 text-white" />
                    </div>
                    <span>Keluar dari Aplikasi</span>
                </button>

                {/* Footer Copy */}
                <div className="text-center py-2 opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Berkah88 • Versi 1.6.1</p>
                </div>
            </div>

            {/* Profile Modal */}
            {isProfileModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Atur Profil</h2>
                            <button onClick={() => setIsProfileModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform">
                                <Icon name="X" className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] ml-2 mb-2 block">Nomor Telepon</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl py-4 px-5 text-gray-700 font-bold transition-all outline-none"
                                        placeholder="Contoh: 08123456789"
                                        value={tempPhone}
                                        onChange={(e) => setTempPhone(e.target.value)}
                                    />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300">
                                        <Icon name="Phone" className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] ml-2 mb-2 block">Alamat Lengkap</label>
                                <div className="relative">
                                    <textarea
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl p-5 text-gray-700 font-bold transition-all outline-none min-h-[120px]"
                                        placeholder="Masukkan alamat pengiriman Anda..."
                                        value={tempAddress}
                                        onChange={(e) => setTempAddress(e.target.value)}
                                    />
                                    <div className="absolute right-5 bottom-5 text-gray-300">
                                        <Icon name="MapPin" className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleUpdateProfile}
                                disabled={isLoading}
                                className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 mt-2"
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Modal */}
            {isAccountModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Keamanan Akun</h2>
                            <button onClick={() => setIsAccountModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform">
                                <Icon name="X" className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-50 pb-2">
                                <Icon name="Shield" className="w-4 h-4 text-green-600" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ubah Password</span>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] ml-2 mb-2 block">Password Sekarang</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.current ? "text" : "password"}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl py-4 px-5 text-gray-700 font-bold transition-all outline-none"
                                        placeholder="Masukkan password saat ini"
                                        value={securityData.currentPassword}
                                        onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                    />
                                    <button
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"
                                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                                    >
                                        <Icon name={showPasswords.current ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] ml-2 mb-2 block">Password Baru</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.new ? "text" : "password"}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl py-4 px-5 text-gray-700 font-bold transition-all outline-none"
                                        placeholder="Minimal 6 karakter"
                                        value={securityData.newPassword}
                                        onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                    />
                                    <button
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"
                                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                                    >
                                        <Icon name={showPasswords.new ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] ml-2 mb-2 block">Konfirmasi Password</label>
                                <div className="relative">
                                    <input
                                        type={showPasswords.confirm ? "text" : "password"}
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-green-500 focus:bg-white rounded-2xl py-4 px-5 text-gray-700 font-bold transition-all outline-none"
                                        placeholder="Ulangi password baru"
                                        value={securityData.confirmPassword}
                                        onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                    />
                                    <button
                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300"
                                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                                    >
                                        <Icon name={showPasswords.confirm ? "EyeOff" : "Eye"} className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleChangePassword}
                                disabled={isLoading}
                                className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-200 active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
                            >
                                {isLoading ? 'Memproses...' : 'Perbarui Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            {isNotifModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Pengaturan Notifikasi</h2>
                            <button onClick={() => setIsNotifModalOpen(false)} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-90 transition-transform">
                                <Icon name="X" className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2 border-b border-gray-50 pb-2">
                                <Icon name="Bell" className="w-4 h-4 text-blue-600" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipe Pemberitahuan</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Pesanan Saya</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Status order & detail</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotificationSettings({ ...notifSettings, orders: !notifSettings.orders })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings.orders ? 'bg-green-500' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifSettings.orders ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Pesan Chat</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Pesan dari tim toko</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotificationSettings({ ...notifSettings, chat: !notifSettings.chat })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings.chat ? 'bg-green-500' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifSettings.chat ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="font-bold text-gray-800 text-sm">Info Promo</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Diskon & voucher baru</p>
                                    </div>
                                    <button
                                        onClick={() => updateNotificationSettings({ ...notifSettings, promo: !notifSettings.promo })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${notifSettings.promo ? 'bg-green-500' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${notifSettings.promo ? 'right-1' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-8 mb-2 border-b border-gray-50 pb-2">
                                <Icon name="PlayCircle" className="w-4 h-4 text-blue-600" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Suara Notifikasi</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {NOTIFICATION_SOUNDS.map((sound) => (
                                    <div
                                        key={sound.id}
                                        onClick={() => changeNotificationSound(sound.id)}
                                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-2 ${selectedSoundId === sound.id ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-gray-50 active:bg-gray-100'}`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${selectedSoundId === sound.id ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                            <Icon name={selectedSoundId === sound.id ? 'Check' : 'PlayCircle'} size={14} />
                                        </div>
                                        <span className={`text-[10px] font-black truncate ${selectedSoundId === sound.id ? 'text-green-700' : 'text-gray-500'}`}>
                                            {sound.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerProfile;
