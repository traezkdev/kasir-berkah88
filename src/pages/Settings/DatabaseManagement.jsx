import React, { useState } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import AppIcon from '../../components/AppIcon';
import { useTheme } from '../../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

const apiUrl = import.meta.env.VITE_API_URL;

const DatabaseManagement = () => {
    const { theme } = useTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleBackup = async () => {
        setIsLoading(true);
        try {
            const response = await authFetch(`${apiUrl}/api/database/backup`);
            if (!response.ok) throw new Error('Gagal mengunduh backup');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
            if (contentDisposition && contentDisposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(contentDisposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/[ '"]/g, '');
                }
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success('Backup database berhasil diunduh!');
        } catch (err) {
            console.error('Backup error:', err);
            toast.error(err.message || 'Terjadi kesalahan saat membuat backup');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleRestore = async () => {
        if (!selectedFile) {
            toast.error('Pilih file backup terlebih dahulu');
            return;
        }

        setIsRestoreModalOpen(false);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('backupFile', selectedFile);

        try {
            const response = await authFetch(`${apiUrl}/api/database/restore`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                toast.success('Database berhasil dikembalikan (restore)!');
                setSelectedFile(null);
                // Reload after a short delay
                setTimeout(() => window.location.reload(), 2000);
            } else {
                toast.error(data.error || 'Gagal melakukan restore');
            }
        } catch (err) {
            console.error('Restore error:', err);
            toast.error('Kesalahan jaringan atau file tidak valid');
        } finally {
            setIsLoading(false);
        }
    };

    const breadcrumbs = [
        { name: 'Beranda', path: '/main-dashboard' },
        { name: 'Pengaturan', path: '/settings' },
        { name: 'Manajemen Database', path: '/settings/database' }
    ];

    return (
        <div className="flex flex-col h-screen bg-background">
            {theme === 'default' && <NavigationHeader title="Manajemen Database" />}
            <main className={`flex-grow ${theme === 'default' ? 'pt-16' : ''}`}>
                <div className={theme === 'default' ? "max-w-4xl mx-auto px-4 lg:px-8 py-8 pb-24 lg:pb-8" : "w-full p-4 lg:p-8"}>
                    <div className="hidden md:block">
                        <BreadcrumbNavigation paths={breadcrumbs} />
                    </div>

                    <header className="mt-6 mb-10">
                        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-text-primary flex items-center gap-3">
                            <AppIcon name="Database" className="w-10 h-10 text-primary" /> Manajemen Database
                        </h1>
                        <p className="mt-3 text-lg text-text-secondary max-w-2xl">
                            Amankan data Anda dengan melakukan pencadangan berkala atau pulihkan data dari file cadangan sebelumnya.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Backup Section */}
                        <div className="bg-card p-8 rounded-2xl shadow-xl border border-border flex flex-col items-center text-center space-y-6 transform transition-all hover:scale-[1.01]">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                <AppIcon name="Download" className="w-8 h-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">Cadangkan Data</h2>
                                <p className="text-sm text-text-secondary mt-2">
                                    Unduh seluruh data database (Menu, Transaksi, Stok, Karyawan, Kasbon, Chat, hingga Log Aktivitas) ke dalam file .json.
                                </p>
                                <div className="mt-3 flex flex-wrap justify-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-[10px] font-bold text-blue-600 dark:text-blue-400 rounded-md uppercase">26+ Tabel</span>
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-[10px] font-bold text-green-600 dark:text-green-400 rounded-md uppercase">Semua Riwayat</span>
                                    <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-[10px] font-bold text-amber-600 dark:text-amber-400 rounded-md uppercase text-xs">Kecuali File Gambar</span>
                                </div>
                            </div>
                            <Button
                                onClick={handleBackup}
                                disabled={isLoading}
                                className="w-full py-6 text-lg font-semibold shadow-lg shadow-primary/20"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Memproses...
                                    </div>
                                ) : 'Unduh Backup Sekarang'}
                            </Button>
                        </div>

                        {/* Restore Section */}
                        <div className="bg-card p-8 rounded-2xl shadow-xl border border-border flex flex-col items-center text-center space-y-6 transform transition-all hover:scale-[1.01]">
                            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center">
                                <AppIcon name="Upload" className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-text-primary">Pulihkan Data</h2>
                                <p className="text-sm text-text-secondary mt-2">
                                    Kembalikan data dari file backup. <span className="text-red-500 font-semibold underline">Peringatan:</span> Data saat ini akan terhapus dan diganti!
                                </p>
                            </div>
                            <div className="w-full space-y-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".json"
                                        onChange={handleFileChange}
                                        id="restore-file"
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="restore-file"
                                        className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <AppIcon name="FileJson" className={`w-6 h-6 mb-2 ${selectedFile ? 'text-primary' : 'text-text-secondary'}`} />
                                        <span className="text-sm text-text-primary font-medium truncate max-w-full px-4">
                                            {selectedFile ? selectedFile.name : 'Pilih file backup (.json)'}
                                        </span>
                                    </label>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsRestoreModalOpen(true)}
                                    disabled={isLoading || !selectedFile}
                                    className={`w-full py-6 text-lg font-semibold border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all ${!selectedFile ? 'opacity-50 cursor-not-allowed grayscale' : ''
                                        }`}
                                >
                                    Pulihkan Sekarang
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Security Tip */}
                    <div className="mt-12 bg-blue-500/5 border border-blue-500/20 p-6 rounded-xl flex gap-4 items-start">
                        <AppIcon name="ShieldCheck" className="w-6 h-6 text-blue-500 shrink-0" />
                        <div>
                            <h4 className="font-semibold text-text-primary">Tips Keamanan</h4>
                            <p className="text-sm text-text-secondary mt-1">
                                Sangat disarankan untuk melakukan backup setiap hari sebelum menutup toko. Simpan file backup di tempat yang aman (Google Drive atau flashdisk) agar data Anda tetap aman jika terjadi masalah pada aplikasi.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <ConfirmationModal
                isOpen={isRestoreModalOpen}
                onClose={() => setIsRestoreModalOpen(false)}
                onConfirm={handleRestore}
                title="Konfirmasi Restore Database"
                message={`Anda yakin ingin memulihkan database dari file "${selectedFile?.name}"? Tindakan ini akan MENGHAPUS SEMUA DATA saat ini dan menggantinya dengan data dari file backup. Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, Pulihkan Sekarang"
                cancelText="Batal"
                variant="destructive"
            />
        </div>
    );
};

export default DatabaseManagement;
