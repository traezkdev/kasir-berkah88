import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { jwtDecode } from 'jwt-decode';

const CustomerProfile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        username: 'Pelanggan',
        role: 'user',
        phone: '',
        address: '',
        avatar_url: null
    });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [tempAddress, setTempAddress] = useState('');
    const [tempPhone, setTempPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    useEffect(() => {
        fetchProfile();
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
            }
        } catch (error) {
            console.error("Error updating profile:", error);
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
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header Premium (Dana Look) */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 pb-16 text-white rounded-b-[2.5rem] shadow-lg mb-[-40px]">
                <h1 className="text-2xl font-black tracking-tight mb-1">Profil Saya</h1>
                <p className="text-green-100 text-xs font-medium opacity-80 uppercase tracking-widest">Informasi & Pengaturan Akun</p>
            </div>

            <div className="px-5 space-y-4 relative z-10">
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

                {/* Menu List */}
                <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/40 overflow-hidden border border-white">
                    {[
                        {
                            icon: 'MapPin',
                            label: 'Alamat Tersimpan',
                            color: 'text-blue-500',
                            desc: userData.address || 'Klik untuk atur alamat',
                            onClick: () => setIsProfileModalOpen(true)
                        },
                        {
                            icon: 'ShoppingBag',
                            label: 'Status Pesanan',
                            color: 'text-orange-500',
                            desc: 'Lacak pesanan aktif Anda',
                            onClick: () => navigate('/customer/order-confirmation')
                        },
                        { icon: 'CreditCard', label: 'Metode Pembayaran', color: 'text-purple-500', desc: 'Dana, QRIS, Tunai' },
                        { icon: 'HelpCircle', label: 'Bantuan & Dukungan', color: 'text-amber-500', desc: 'Pusat bantuan 24/7' },
                        { icon: 'Settings', label: 'Pengaturan Akun', color: 'text-emerald-500', desc: 'Keamanan & Notifikasi' }
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            onClick={item.onClick}
                            className={`flex items-center gap-4 p-5 border-b last:border-0 border-gray-50 ${item.onClick ? 'cursor-pointer active:bg-gray-50' : 'opacity-60'} transition-all duration-200 group`}
                        >
                            <div className={`p-3 rounded-2xl group-active:scale-90 transition-transform ${item.color.replace('text', 'bg').replace('500', '50')} ${item.color}`}>
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
                <div className="text-center py-6 opacity-20">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Berkah88 • Versi 2.0.4</p>
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
        </div>
    );
};

export default CustomerProfile;
