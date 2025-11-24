import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddRawMaterialModal = ({ isOpen, onClose, onMaterialAdded }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [pricePerItem, setPricePerItem] = useState('');
  const [standardStockPerDay, setStandardStockPerDay] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen) {
      setName('');
      setUnit('');
      setPricePerItem('');
      setStandardStockPerDay('');
      setMinStockLevel('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !unit) {
      setError("Nama dan satuan bahan mentah tidak boleh kosong.");
      return;
    }
    if (parseFloat(pricePerItem) < 0) {
      setError("Harga per item tidak boleh negatif.");
      return;
    }
    if (parseFloat(standardStockPerDay) < 0) {
      setError("Stok standar per hari tidak boleh negatif.");
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
      await axios.post(`${API_BASE_URL}/api/raw-materials`, {
        name,
        unit,
        min_stock_level: parseFloat(minStockLevel) || 0,
        price_per_item: parseFloat(pricePerItem) || 0,
        standard_stock_per_day: parseFloat(standardStockPerDay) || 0,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Bahan mentah baru berhasil ditambahkan!");
      onMaterialAdded(); // Memberi tahu parent komponen untuk me-refresh data
      onClose();
    } catch (err) {
      console.error("Error adding raw material:", err);
      setError(err.response?.data?.error || "Gagal menambahkan bahan mentah baru. Mungkin nama sudah ada.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Tambah Bahan Mentah Baru</h2>
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
            <label htmlFor="unit" className="block text-gray-700 text-sm font-bold mb-2">Satuan (Contoh: kg, liter, pcs)</label>
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
            <label htmlFor="pricePerItem" className="block text-gray-700 text-sm font-bold mb-2">Harga per Item (Opsional)</label>
            <input
              type="number"
              id="pricePerItem"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="standardStockPerDay" className="block text-gray-700 text-sm font-bold mb-2">Stok Standar per Hari (Opsional)</label>
            <input
              type="number"
              id="standardStockPerDay"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={standardStockPerDay}
              onChange={(e) => setStandardStockPerDay(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="minStockLevel" className="block text-gray-700 text-sm font-bold mb-2">Batas Stok Minimum (Opsional)</label>
            <input
              type="number"
              id="minStockLevel"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              min="0"
              step="0.01"
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
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Tambah Bahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRawMaterialModal;