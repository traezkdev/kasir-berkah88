import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const CustomerProfile = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white p-6 mb-4">
                <h1 className="text-2xl font-bold mb-1">Akun Saya</h1>
                <p className="text-gray-500 text-sm">Kelola informasi profil Anda</p>
            </div>

            <div className="px-4 space-y-4">
                <div className="bg-white p-4 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        <Icon name="User" className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">Pelanggan Setia</h3>
                        <p className="text-gray-500 text-sm">+62 812-3456-7890</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {[
                        { icon: 'MapPin', label: 'Alamat Tersimpan' },
                        { icon: 'CreditCard', label: 'Metode Pembayaran' },
                        { icon: 'HelpCircle', label: 'Bantuan & Dukungan' },
                        { icon: 'Settings', label: 'Pengaturan' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 border-b last:border-0 border-gray-100 cursor-pointer hover:bg-gray-50">
                            <Icon name={item.icon} className="w-5 h-5 text-gray-600" />
                            <span className="flex-1 font-medium text-gray-700">{item.label}</span>
                            <Icon name="ChevronRight" className="w-4 h-4 text-gray-400" />
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                    <Icon name="LogOut" className="w-5 h-5" />
                    Keluar
                </button>
            </div>
        </div>
    );
};

export default CustomerProfile;
