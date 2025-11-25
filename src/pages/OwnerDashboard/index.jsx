import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import OwnerNavigationHeader from '../../components/ui/OwnerNavigationHeader';
import MetricsCard from '../main-dashboard/components/MetricsCard';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';

const OwnerDashboard = ({ headerTitle }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    // Define navigation items for the owner dashboard
    const ownerFeatures = [
        {
            title: "Uang Bisnis",
            value: "Kelola Arus Kas",
            icon: "DollarSign",
            color: "success",
            description: "Pantau saldo, deposit, dan pengeluaran",
            path: "/uang-bisnis"
        },
        {
            title: "Laporan Bisnis",
            value: "Lihat Detail",
            icon: "BarChart3",
            color: "primary",
            description: "Analisis komprehensif performa bisnis",
            path: "/owner/business-reports"
        },
        // Add more features here as needed
        {
            title: "Stok Bahan Baku",
            value: "Cek & Kelola",
            icon: "Archive",
            color: "warning",
            description: "Manajemen stok bahan baku mentah",
            path: "/owner-raw-material-stock"
        },
        {
            title: "Manajemen Menu",
            value: "Atur & Ubah",
            icon: "BookCopy",
            color: "info",
            description: "Kelola daftar menu dan harga",
            path: "/menu-management"
        }
    ];

    return (
        <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
            <OwnerNavigationHeader onToggleSidebar={() => {}} headerTitle={headerTitle || 'Dashboard Owner'} />
            <main className={`pb-20 lg:pb-8 pt-16`}>
                <div className="max-w-7xl mx-auto px-4 lg:px-6">
                    <div className="mb-6 mt-4">
                        <BreadcrumbNavigation />
                        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                            Dashboard Owner
                        </h1>
                        <p className="text-text-secondary mt-1">
                            Selamat datang! Akses cepat fitur-fitur utama Anda.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                        {ownerFeatures.map((feature, index) => (
                            <div key={index} onClick={() => navigate(feature.path)} className="cursor-pointer transform hover:scale-105 transition-transform duration-300">
                                <MetricsCard
                                    title={feature.title}
                                    value={feature.value}
                                    icon={feature.icon}
                                    color={feature.color}
                                    description={feature.description}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OwnerDashboard;
