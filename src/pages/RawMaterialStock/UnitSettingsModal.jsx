import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
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
            showMessage("Satuan berhasil ditambahkan.");
        } catch (err) {
            console.error("Error adding unit:", err);
            if (err.response && err.response.status === 409) {
                showError("Nama satuan sudah ada.");
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
            fetchUnits(); // Refresh to reflect changes
            // showMessage(`Status kalkulasi untuk ${unit.name} diperbarui.`);
        } catch (err) {
            console.error("Error updating unit:", err);
            showError("Gagal memperbarui status satuan.");
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!window.confirm("Hapus satuan ini?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/api/units/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUnits();
            showMessage("Satuan dihapus.");
        } catch (err) {
            console.error("Error deleting unit:", err);
            showError("Gagal menghapus satuan.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-card rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-card-foreground">Pengaturan Satuan</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes size={20} />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200">
                        <strong className="block mb-1">Mengenai Kalkulasi Nilai:</strong>
                        Aktifkan "Hitung Nilai" jika satuan ini harus dihitung ke dalam total nilai aset stok (misal: Kg, Box, Pcs).
                        Matikan jika bahan dengan satuan ini (misal: Gram, Ml) nilainya dianggap Rp 0 dalam laporan aset.
                    </p>

                    <form onSubmit={handleAddUnit} className="mb-6 flex gap-2">
                        <input
                            type="text"
                            value={newUnitName}
                            onChange={(e) => setNewUnitName(e.target.value)}
                            placeholder="Tambah satuan baru (contoh: Piring)"
                            className="flex-1 p-2 border rounded bg-background text-foreground"
                        />
                        <button
                            type="submit"
                            disabled={!newUnitName.trim()}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
                        >
                            <FaPlus /> Tambah
                        </button>
                    </form>

                    {loading ? (
                        <div className="text-center py-4">Memuat data...</div>
                    ) : (
                        <div className="space-y-2">
                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-2 font-medium text-sm text-gray-500 mb-2 px-2">
                                <div className="col-span-5">Nama Satuan</div>
                                <div className="col-span-5 text-center">Hitung Nilai?</div>
                                <div className="col-span-2 text-right">Aksi</div>
                            </div>

                            {units.map((unit) => (
                                <div key={unit.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded hover:bg-muted/50 border border-transparent hover:border-border transition-colors">
                                    <div className="col-span-5 font-medium">{unit.name}</div>
                                    <div className="col-span-5 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleCalculable(unit)}
                                            className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                            ${unit.is_calculable ? 'bg-green-500' : 'bg-gray-300'}
                        `}
                                        >
                                            <span
                                                className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${unit.is_calculable ? 'translate-x-6' : 'translate-x-1'}
                            `}
                                            />
                                        </button>
                                        <span className="ml-2 text-xs font-medium w-12 pt-1">{unit.is_calculable ? 'Ya' : 'Tidak'}</span>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button
                                            onClick={() => handleDeleteUnit(unit.id)}
                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Hapus"
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {units.length === 0 && (
                                <p className="text-center text-gray-500 py-4">Belum ada data satuan.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnitSettingsModal;
