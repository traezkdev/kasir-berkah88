import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const StockOutModal = ({ isOpen, onClose, material, onStockUpdated }) => {
  const [quantity, setQuantity] = useState('');
  const [transactionDate, setTransactionDate] = useState(moment().format('YYYY-MM-DDTHH:mm'));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setTransactionDate(moment().format('YYYY-MM-DDTHH:mm'));
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || parseFloat(quantity) <= 0) {
      setError("Jumlah keluar harus lebih besar dari 0.");
      return;
    }
    if (!transactionDate) {
      setError("Tanggal transaksi diperlukan.");
      return;
    }
    if (parseFloat(quantity) > material.current_stock) {
      setError(`Jumlah keluar melebihi stok yang tersedia (${material.current_stock} ${material.unit}).`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/raw-materials/stock-out`, {
        material_id: material.id,
        quantity: parseFloat(quantity),
        transaction_date: transactionDate,
        notes,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Stok keluar berhasil dicatat!");
      onStockUpdated(); // Memberi tahu parent komponen untuk me-refresh data
      onClose();
    } catch (err) {
      console.error("Error recording stock-out:", err);
      setError(err.response?.data?.error || "Gagal mencatat stok keluar.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Stok Keluar: {material.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="quantity" className="block text-gray-700 text-sm font-bold mb-2">Jumlah Keluar</label>
            <input
              type="number"
              id="quantity"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0.01"
              step="0.01"
              required
            />
            <p className="text-gray-600 text-xs mt-1">Stok tersedia: {parseInt(material.current_stock)} {material.unit}</p>
          </div>
          <div className="mb-4">
            <label htmlFor="transactionDate" className="block text-gray-700 text-sm font-bold mb-2">Tanggal Transaksi</label>
            <input
              type="datetime-local"
              id="transactionDate"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="notes" className="block text-gray-700 text-sm font-bold mb-2">Keterangan (Opsional)</label>
            <textarea
              id="notes"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            ></textarea>
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
              className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockOutModal;