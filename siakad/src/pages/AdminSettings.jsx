/**
 * ADMIN SETTINGS PAGE - SIAS PRO
 * 
 * TUJUAN HALAMAN:
 * Sebagai pusat kontrol konfigurasi dinamis aplikasi SIAS PRO.
 * Halaman ini dirancang agar mudah diperluas (scalable) untuk berbagai kategori pengaturan
 * di masa depan (Tampilan, Akademik, Sistem, Notifikasi, dll) tanpa mengotori UI utama.
 * 
 * STRUKTUR:
 * 1. Kategori Cards: Menampilkan ringkasan pengaturan dalam bentuk kartu visual.
 * 2. Sistem Modal: Satu modal dinamis yang merender form berdasarkan kategori yang dipilih.
 * 3. Batch Update API: Mengirimkan perubahan pengaturan dalam satu request objek.
 */

import React, { useState, useEffect } from 'react';
import { FaCog, FaDesktop, FaSchool, FaShieldAlt, FaChevronRight, FaSave, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
    // ---------------------------------------------------------
    // 1. STATE MANAGEMENT
    // ---------------------------------------------------------
    const [settings, setSettings] = useState({
        welcome_title: '',
        welcome_subtitle: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Antarmuka Modal
    const [activeCategory, setActiveCategory] = useState(null); // 'tampilan', 'sekolah', dll
    const [tempSettings, setTempSettings] = useState({}); // State sementara saat di dalam modal

    // ---------------------------------------------------------
    // 2. DATA FETCHING
    // ---------------------------------------------------------
    const fetchSettings = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/settings`);
            const data = await response.json();
            if (response.ok) {
                setSettings(data);
            }
        } catch (err) {
            toast.error("Gagal memuat pengaturan sistem.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // ---------------------------------------------------------
    // 3. EVENT HANDLERS
    // ---------------------------------------------------------

    // Membuka modal dan menyalin state ke tempSettings
    const openEditor = (category) => {
        setActiveCategory(category);
        setTempSettings({ ...settings });
    };

    // Menyimpan perubahan dari modal ke database
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem('siakad_token');
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(tempSettings)
            });

            if (response.ok) {
                setSettings(tempSettings); // Update state utama
                toast.success("Pengaturan berhasil diperbarui!");
                setActiveCategory(null); // Tutup modal
            } else {
                toast.error("Gagal menyimpan perubahan.");
            }
        } catch (err) {
            toast.error("Terjadi kesalahan koneksi.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="p-20 text-center font-black animate-pulse text-slate-400 tracking-widest uppercase italic">Initializing System Config...</div>;

    return (
        <div className="p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto space-y-10">
            {/* Header Utama */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                            <FaCog className="text-white animate-[spin_10s_linear_infinite]" size={24} />
                        </div>
                        Pusat Kontrol Sistem
                    </h1>
                    <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium text-lg">Konfigurasi parameter dan identitas digital SIAS PRO.</p>
                </div>
            </div>

            {/* Grid Kategori Pengaturan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Kategori: Tampilan Landing */}
                <button
                    onClick={() => openEditor('tampilan')}
                    className="group relative p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none text-left transition-all hover:scale-[1.03] hover:shadow-2xl hover:border-indigo-500 overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-500">
                        <FaDesktop size={80} />
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl w-fit mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <FaDesktop size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">Tampilan Landing</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6">Kelola teks sambutan, judul promo, dan deskripsi pada halaman login.</p>
                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-black text-xs uppercase tracking-widest gap-2">
                        <span>Konfigurasi Sekarang</span>
                        <FaChevronRight size={10} className="group-hover:translate-x-2 transition-transform" />
                    </div>
                </button>

                {/* 2. Kategori: Identitas Sekolah (Placeholder untuk masa depan) */}
                <button className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700 text-left opacity-60 cursor-not-allowed group">
                    <div className="p-4 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-2xl w-fit mb-6">
                        <FaSchool size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 mb-2 uppercase tracking-tight">Profil Sekolah</h3>
                    <p className="text-slate-400 text-sm font-medium italic">Fitur dalam pengembangan...</p>
                </button>

                {/* 3. Kategori: Keamanan (Placeholder untuk masa depan) */}
                <button className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-300 dark:border-slate-700 text-left opacity-60 cursor-not-allowed group">
                    <div className="p-4 bg-slate-200 dark:bg-slate-800 text-slate-400 rounded-2xl w-fit mb-6">
                        <FaShieldAlt size={24} />
                    </div>
                    <h3 className="text-xl font-black text-slate-400 mb-2 uppercase tracking-tight">Keamanan & Akses</h3>
                    <p className="text-slate-400 text-sm font-medium italic">Fitur dalam pengembangan...</p>
                </button>

            </div>

            {/* MODAL EDITOR DINAMIS */}
            {activeCategory && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                    {/* Backdrop: Kami gunakan fixed inset-0 agar benar-benar menutupi seluruh layar tanpa celah */}
                    <div
                        className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl transition-opacity duration-300"
                        onClick={() => setActiveCategory(null)}
                    ></div>

                    {/* Card Modal */}
                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_0_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden animate-in zoom-in fade-in duration-300">

                        {/* Modal Header */}
                        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight">Edit {activeCategory}</h2>
                                <p className="text-indigo-100/70 text-sm font-bold uppercase tracking-widest mt-1">Konfigurasi Tingkat Sistem</p>
                            </div>
                            <button onClick={() => setActiveCategory(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all font-black text-xl">×</button>
                        </div>

                        {/* Modal Body: Render Form Based on Category */}
                        <div className="p-10 max-h-[70vh] overflow-y-auto space-y-8">

                            {activeCategory === 'tampilan' && (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Judul Utama (Mendukung HTML)</label>
                                        <textarea
                                            rows="3"
                                            value={tempSettings.welcome_title}
                                            onChange={(e) => setTempSettings({ ...tempSettings, welcome_title: e.target.value })}
                                            className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl outline-none focus:border-indigo-500 transition-all font-bold text-slate-700 dark:text-white"
                                            placeholder="Gunakan <br> untuk baris baru..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Pendek</label>
                                        <textarea
                                            rows="3"
                                            value={tempSettings.welcome_subtitle}
                                            onChange={(e) => setTempSettings({ ...tempSettings, welcome_subtitle: e.target.value })}
                                            className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl outline-none focus:border-indigo-500 transition-all font-medium text-slate-700 dark:text-white"
                                            placeholder="Masukkan deskripsi aplikasi..."
                                        />
                                    </div>

                                    {/* Preview Section */}
                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Preview Tampilan</h4>
                                        <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[2.5rem] text-white shadow-2xl">
                                            <div dangerouslySetInnerHTML={{ __html: tempSettings.welcome_title }} className="text-3xl font-black mb-4 leading-tight" />
                                            <p className="text-indigo-100/70 text-sm leading-relaxed">{tempSettings.welcome_subtitle}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                            <button
                                onClick={() => setActiveCategory(null)}
                                className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-sm hover:shadow-md transition-all active:scale-95"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50"
                            >
                                <FaSave />
                                {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSettings;
