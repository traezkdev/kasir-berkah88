import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddRawMaterialModal = ({ isOpen, onClose, onMaterialAdded, showMessage, showError }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('pcs');
  const [pricePerItem, setPricePerItem] = useState('');
  const [standardStockPerDay, setStandardStockPerDay] = useState('');
  const [stokMinimum, setStokMinimum] = useState('');
  const [purchaseBufferAmount, setPurchaseBufferAmount] = useState(''); // New state for purchase buffer
  const [menuStock, setMenuStock] = useState(''); // New state for menu_stock
  const [rawStockPrice, setRawStockPrice] = useState(''); // New state for raw_stock_price
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [units, setUnits] = useState([]); // State for units

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen) {
      setName('');
      setUnit('');
      setCustomUnit('pcs');
      setPricePerItem('');
      setStandardStockPerDay('');
      setStokMinimum('');
      setPurchaseBufferAmount(''); // Initialize purchaseBufferAmount
      setMenuStock(''); // Initialize menuStock
      setRawStockPrice(''); // Initialize rawStockPrice
      setError(null);
      fetchUnits(); // Fetch units when modal opens
    }
  }, [isOpen]);

  const fetchUnits = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/units`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnits(response.data.data);
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !unit) {
      setError("Nama dan satuan bahan mentah tidak boleh kosong.");
      return;
    }
    if (parseFloat(pricePerItem) < 0 || parseFloat(standardStockPerDay) < 0 || parseFloat(stokMinimum) < 0 || parseFloat(purchaseBufferAmount) < 0 || parseFloat(menuStock) < 0 || parseFloat(rawStockPrice) < 0) { // Add purchaseBufferAmount validation
      setError("Nilai numerik tidak boleh negatif.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/raw-materials`, {
        name,
        unit,
        custom_unit: customUnit,
        stok_minimum: parseFloat(stokMinimum) || 0,
        price_per_item: parseFloat(pricePerItem) || 0,
        standard_stock_per_day: parseFloat(standardStockPerDay) || 0,
        purchase_buffer_amount: parseFloat(purchaseBufferAmount) || 0, // Include purchase_buffer_amount
        menu_stock: parseFloat(menuStock) || 0, // Include menu_stock in the creation
        raw_stock_price: parseFloat(rawStockPrice) || 0, // Include raw_stock_price
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      showMessage("Bahan mentah baru berhasil ditambahkan!");
      onMaterialAdded();
      onClose();
    } catch (err) {
      console.error("Error adding raw material:", err);
      showError(err.response?.data?.error || "Gagal menambahkan bahan mentah baru. Mungkin nama sudah ada.");
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
            <select
              id="unit"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            >
              <option value="">Pilih Satuan</option>
              {units.map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="currentStock" className="block text-gray-700 text-sm font-bold mb-2">Stok Menu (Opsional, default 0)</label>
            <input
              type="number"
              id="menuStock"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={menuStock}
              onChange={(e) => setMenuStock(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="pricePerItem" className="block text-gray-700 text-sm font-bold mb-2">Harga Stok Menu (Opsional)</label>
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
            <label htmlFor="rawStockPrice" className="block text-gray-700 text-sm font-bold mb-2">Harga Stok Mentah (Opsional)</label>
            <input
              type="number"
              id="rawStockPrice"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={rawStockPrice}
              onChange={(e) => setRawStockPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="stokMinimum" className="block text-gray-700 text-sm font-bold mb-2">Stok Minimum (Opsional)</label>
            <input
              type="number"
              id="stokMinimum"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={stokMinimum}
              onChange={(e) => setStokMinimum(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="purchaseBufferAmount" className="block text-gray-700 text-sm font-bold mb-2">Jumlah Buffer Pembelian (Opsional, Default 10)</label>
            <input
              type="number"
              id="purchaseBufferAmount"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={purchaseBufferAmount}
              onChange={(e) => setPurchaseBufferAmount(e.target.value)}
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
      </div >
    </div >
  );
};

export default AddRawMaterialModal;