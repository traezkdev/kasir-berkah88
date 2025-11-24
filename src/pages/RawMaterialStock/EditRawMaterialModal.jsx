import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditRawMaterialModal = ({ isOpen, onClose, material, onMaterialUpdated }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen && material) {
      setName(material.name || ''); // Pastikan selalu string
      setUnit(material.unit || '');   // Pastikan selalu string
      setMinStockLevel(material.min_stock_level !== undefined && material.min_stock_level !== null ? parseInt(material.min_stock_level) : ''); // Ubah ke integer
      setError(null);
    }
  }, [isOpen, material]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !unit) {
      setError("Nama dan satuan tidak boleh kosong.");
      return;
    }
    if (parseFloat(minStockLevel) < 0) {
      setError("Batas stok minimum tidak boleh negatif.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/raw-materials/${material.id}`, {
        name,
        unit,
        min_stock_level: parseFloat(minStockLevel),
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Bahan mentah berhasil diperbarui!");
      onMaterialUpdated(); // Memberi tahu parent komponen untuk me-refresh data
      onClose();
    } catch (err) {
      console.error("Error updating raw material:", err);
      setError(err.response?.data?.error || "Gagal memperbarui bahan mentah.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !material) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Bahan Mentah: {material.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nama Bahan</label>
            <input
              type="text"
              id="name"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="unit" className="block text-gray-700 text-sm font-bold mb-2">Satuan</label>
            <input
              type="text"
              id="unit"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="minStockLevel" className="block text-gray-700 text-sm font-bold mb-2">Batas Stok Minimum</label>
            <input
              type="number"
              id="minStockLevel"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Memperbarui...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRawMaterialModal;