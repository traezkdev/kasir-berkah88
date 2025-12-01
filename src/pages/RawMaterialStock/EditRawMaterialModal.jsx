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
  const [menuStock, setMenuStock] = useState(''); // New state for menu_stock
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen && material) {
      setName(material.name || '');
      setUnit(material.unit || '');
      setCustomUnit(material.custom_unit || 'pcs');
      const stokMinVal = parseFloat(material.stok_minimum);
      if (!isNaN(stokMinVal)) {
        if (stokMinVal % 1 !== 0) {
          setStokMinimum(stokMinVal);
        } else {
          setStokMinimum(parseInt(stokMinVal, 10));
        }
      } else {
        setStokMinimum('');
      }
      setPricePerItem(material.price_per_item ?? '');
      const standardStockVal = parseFloat(material.standard_stock_per_day);
      if (!isNaN(standardStockVal)) {
        if (standardStockVal % 1 !== 0) {
          setStandardStockPerDay(standardStockVal);
        } else {
          setStandardStockPerDay(parseInt(standardStockVal, 10));
        }
      } else {
        setStandardStockPerDay('');
      }
      const suggestionVal = parseFloat(material.suggestion_purchase_quantity);
      if (!isNaN(suggestionVal)) {
        if (suggestionVal % 1 !== 0) {
          setSuggestionPurchaseQuantity(suggestionVal);
        } else {
          setSuggestionPurchaseQuantity(parseInt(suggestionVal, 10));
        }
      } else {
        setSuggestionPurchaseQuantity('');
      }
      
      const stockValue = parseFloat(material.current_stock);
      if (!isNaN(stockValue)) {
        if (stockValue % 1 !== 0) {
          setCurrentStock(stockValue);
        } else {
          setCurrentStock(parseInt(stockValue, 10));
        }
      } else {
        setCurrentStock('');
      }
      
      const menuStockValue = parseFloat(material.menu_stock); // Initialize menu_stock
      if (!isNaN(menuStockValue)) {
        if (menuStockValue % 1 !== 0) {
          setMenuStock(menuStockValue);
        } else {
          setMenuStock(parseInt(menuStockValue, 10));
        }
      } else {
        setMenuStock('');
      }

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
        menu_stock: parseFloat(menuStock) || 0, // Include menu_stock in the update
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
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-foreground">Edit Bahan Mentah: {material.name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-muted-foreground text-sm font-bold mb-2">Nama Bahan</label>
            <input
              type="text"
              id="name"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="currentStock" className="block text-muted-foreground text-sm font-bold mb-2">Stok Saat Ini</label>
            <input
              type="number"
              id="currentStock"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="menuStock" className="block text-muted-foreground text-sm font-bold mb-2">Stok Menu</label>
            <input
              type="number"
              id="menuStock"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={menuStock}
              onChange={(e) => setMenuStock(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="unit" className="block text-muted-foreground text-sm font-bold mb-2">Satuan</label>
            <input
              type="text"
              id="unit"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="customUnit" className="block text-muted-foreground text-sm font-bold mb-2">Satuan (Untuk Tampilan, Contoh: potong, buah)</label>
            <input
              type="text"
              id="customUnit"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Contoh: pcs, potong, buah"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="stokMinimum" className="block text-muted-foreground text-sm font-bold mb-2">Stok Minimum</label>
            <input
              type="number"
              id="stokMinimum"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={stokMinimum}
              onChange={(e) => setStokMinimum(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="suggestionPurchaseQuantity" className="block text-muted-foreground text-sm font-bold mb-2">Saran Kuantitas Pembelian</label>
            <input
              type="number"
              id="suggestionPurchaseQuantity"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={suggestionPurchaseQuantity}
              onChange={(e) => setSuggestionPurchaseQuantity(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="pricePerItem" className="block text-muted-foreground text-sm font-bold mb-2">Harga per Item</label>
            <input
              type="number"
              id="pricePerItem"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              min="0"
              step="0.01"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="standardStockPerDay" className="block text-muted-foreground text-sm font-bold mb-2">Stok Standar per Hari</label>
            <input
              type="number"
              id="standardStockPerDay"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={standardStockPerDay}
              onChange={(e) => setStandardStockPerDay(e.target.value)}
              min="0"
              required
            />
          </div>
          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="bg-muted hover:bg-muted-foreground text-muted-foreground font-bold py-2 px-4 rounded mr-2"
              disabled={loading}
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded"
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