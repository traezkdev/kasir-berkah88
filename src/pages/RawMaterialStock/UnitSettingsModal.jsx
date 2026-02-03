import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from '../../components/AppIcon';

const UnitSettingsModal = ({ isOpen, onClose, showMessage, showError }) => {
    const [units, setUnits] = useState([]);
    const [newUnitName, setNewUnitName] = useState('');
    const [loading, setLoading] = useState(false);

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    useEffect(() => {
        if (isOpen) {
            fetchUnits();
        }
    }, [isOpen]);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/units`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnits(response.data.data);
        } catch (err) {
            console.error("Error fetching units:", err);
            showError("Gagal memuat daftar satuan.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUnit = async (e) => {
        e.preventDefault();
        if (!newUnitName.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_BASE_URL}/api/units`, { name: newUnitName.trim() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUnits();
            setNewUnitName('');
            showMessage("Satuan baru telah ditambahkan.");
        } catch (err) {
            console.error("Error adding unit:", err);
            if (err.response && err.response.status === 409) {
                showError("Nama satuan sudah digunakan.");
            } else {
                showError("Gagal menambahkan satuan.");
            }
        }
    };

    const handleToggleCalculable = async (unit) => {
        try {
            const token = localStorage.getItem('token');
            const newStatus = !unit.is_calculable;
            await axios.put(`${API_BASE_URL}/api/units/${unit.id}`, { is_calculable: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state directly for instance feedback
            setUnits(prev => prev.map(u => u.id === unit.id ? { ...u, is_calculable: newStatus } : u));
        } catch (err) {
            console.error("Error updating unit:", err);
            showError("Gagal memperbarui status.");
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!window.confirm("Peringatan: Menghapus satuan mungkin berpengaruh pada data stok yang sudah ada. Lanjutkan?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/units/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUnits(prev => prev.filter(u => u.id !== id));
            showMessage("Satuan berhasil dihapus.");
        } catch (err) {
            console.error("Error deleting unit:", err);
            showError("Gagal menghapus satuan.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-[1001] p-0 lg:p-4 animate-in fade-in duration-300">
            <div
                className="relative bg-white dark:bg-slate-900 w-full lg:max-w-xl h-full lg:h-auto lg:max-h-[85vh] flex flex-col overflow-hidden lg:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom lg:zoom-in duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Header */}
                <div className="relative bg-[#118eea] p-6 lg:p-7 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-white">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                                <Icon name="Settings" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black uppercase tracking-tight leading-tight">Master Satuan</h2>
                                <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Konfigurasi Unit Stok</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center border border-white/20 transition-all active:scale-90 text-white"
                        >
                            <Icon name="X" size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
                    {/* Add Form Container */}
                    <div className="p-6 lg:p-8 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                        <form onSubmit={handleAddUnit} className="flex gap-3">
                            <div className="relative flex-1 group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <Icon name="PlusCircle" size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={newUnitName}
                                    onChange={(e) => setNewUnitName(e.target.value)}
                                    placeholder="Tambah satuan (cth: Piring)"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!newUnitName.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:grayscale text-white px-6 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 shadow-lg shadow-blue-500/20"
                            >
                                Tambah
                            </button>
                        </form>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 lg:p-8 pt-4 space-y-6">
                        {/* Information Note */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30 flex gap-4">
                            <div className="shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Icon name="Info" size={18} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Kalkulasi Aset</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-bold">
                                    Aktifkan <span className="text-blue-600 dark:text-blue-400">Hitung Nilai</span> agar bahan dengan satuan tertentu diperhitungkan dalam total rupiah aset stok.
                                </p>
                            </div>
                        </div>

                        {/* Units List */}
                        {loading && units.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Menyinkronkan data...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3 pb-8">
                                {units.map((unit) => (
                                    <div
                                        key={unit.id}
                                        className="group flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-[#118eea]"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#118eea] transition-colors">
                                                <Icon name="Box" size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm leading-none">{unit.name}</p>
                                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">ID: #{unit.id}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Toggle Switch */}
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Hitung Nilai?</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleCalculable(unit)}
                                                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-all duration-300 outline-none ${unit.is_calculable ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all shadow-sm ${unit.is_calculable ? 'translate-x-7' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            {/* Delete Action */}
                                            <button
                                                onClick={() => handleDeleteUnit(unit.id)}
                                                className="w-10 h-10 bg-rose-50 dark:bg-rose-900/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Icon name="Trash" size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {!loading && units.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-16 opacity-40">
                                        <Icon name="Package" size={48} className="text-slate-300" />
                                        <p className="text-xs font-bold uppercase tracking-widest mt-4">Belum ada satuan</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Tip */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 text-center shrink-0 border-t border-slate-100 dark:border-slate-800 lg:hidden">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Geser ke atas untuk melihat lebih banyak</p>
                </div>
            </div>
        </div>
    );
};

export default UnitSettingsModal;
