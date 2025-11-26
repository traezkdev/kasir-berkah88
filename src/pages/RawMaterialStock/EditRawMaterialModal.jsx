import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EditRawMaterialModal = ({ isOpen, onClose, material, onMaterialUpdated, showMessage, showError }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [stokMinimum, setStokMinimum] = useState('');
  const [pricePerItem, setPricePerItem] = useState('');
  const [standardStockPerDay, setStandardStockPerDay] = useState('');
  const [suggestionPurchaseQuantity, setSuggestionPurchaseQuantity] = useState('');
  const [currentStock, setCurrentStock] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen && material) {
      setName(material.name || '');
      setUnit(material.unit || '');
      setCustomUnit(material.custom_unit || 'pcs');
      setStokMinimum(material.stok_minimum ?? '');
      setPricePerItem(material.price_per_item ?? '');
      setStandardStockPerDay(material.standard_stock_per_day ?? '');
      setSuggestionPurchaseQuantity(material.suggestion_purchase_quantity ?? '');
      setCurrentStock(material.current_stock ?? '');
      setError(null);
    }
  }, [isOpen, material]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !unit) {
      setError("Nama dan satuan tidak boleh kosong.");
      return;
    }
    if (parseFloat(stokMinimum) < 0) {
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
        custom_unit: customUnit,
        stok_minimum: parseFloat(stokMinimum) || 0,
        price_per_item: parseFloat(pricePerItem) || 0,
        standard_stock_per_day: parseFloat(standardStockPerDay) || 0,
        suggestion_purchase_quantity: parseFloat(suggestionPurchaseQuantity) || 0,
        current_stock: parseFloat(currentStock) || 0,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showMessage("Bahan mentah berhasil diperbarui!");
      onMaterialUpdated();
      onClose();
    } catch (err) {
      console.error("Error updating raw material:", err);
      showError(err.response?.data?.error || "Gagal memperbarui bahan mentah.");
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
            <label htmlFor="currentStock" className="block text-gray-700 text-sm font-bold mb-2">Stok Saat Ini</label>
            <input
              type="number"
              id="currentStock"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              min="0"
              step="0.01"
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
            <label htmlFor="customUnit" className="block text-gray-700 text-sm font-bold mb-2">Satuan (Untuk Tampilan, Contoh: potong, buah)</label>
            <input
              type="text"
              id="customUnit"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Contoh: pcs, potong, buah"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="stokMinimum" className="block text-gray-700 text-sm font-bold mb-2">Stok Minimum</label>
            <input
              type="number"
              id="stokMinimum"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={stokMinimum}
              onChange={(e) => setStokMinimum(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="suggestionPurchaseQuantity" className="block text-gray-700 text-sm font-bold mb-2">Saran Kuantitas Pembelian</label>
            <input
              type="number"
              id="suggestionPurchaseQuantity"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={suggestionPurchaseQuantity}
              onChange={(e) => setSuggestionPurchaseQuantity(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="pricePerItem" className="block text-gray-700 text-sm font-bold mb-2">Harga per Item</label>
            <input
              type="number"
              id="pricePerItem"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="standardStockPerDay" className="block text-gray-700 text-sm font-bold mb-2">Stok Standar per Hari</label>
            <input
              type="number"
              id="standardStockPerDay"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={standardStockPerDay}
              onChange={(e) => setStandardStockPerDay(e.target.value)}
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