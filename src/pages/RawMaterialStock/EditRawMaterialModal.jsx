import React, { useState, useEffect } from 'react';
import axios from 'axios';

const formatRupiah = (angka) => {
  if (isNaN(angka) || angka === null || angka === undefined) return '';
  const num = Number(angka);
  if (isNaN(num)) return '';

  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const parseRupiah = (rupiahString) => {
  if (typeof rupiahString !== 'string') {
    return Number(rupiahString) || 0;
  }
  // Remove all non-digit characters (including dots used as thousands separators)
  const cleanedString = rupiahString.replace(/[^\d]/g, '');
  return Number(cleanedString) || 0;
};

const EditRawMaterialModal = ({ isOpen, onClose, material, onMaterialUpdated, showMessage, showError }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [stokMinimum, setStokMinimum] = useState('');
  const [pricePerItem, setPricePerItem] = useState(''); // Stores numeric value
  const [displayPricePerItem, setDisplayPricePerItem] = useState(''); // Stores formatted string for display
  const [rawStockPrice, setRawStockPrice] = useState(''); // Stores numeric value
  const [displayRawStockPrice, setDisplayRawStockPrice] = useState(''); // Stores formatted string for display

  const [purchaseBufferAmount, setPurchaseBufferAmount] = useState(''); // New state for purchase buffer
  const [currentStock, setCurrentStock] = useState('');
  const [menuStock, setMenuStock] = useState(''); // New state for menu_stock
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [units, setUnits] = useState([]); // State for units

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen && material) {
      setName(material.name || '');
      setUnit(material.unit || '');
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

      // Initialize pricePerItem (numeric) and displayPricePerItem (formatted)
      const matPricePerItem = material.price_per_item ?? '';
      const numericMatPrice = Number(matPricePerItem); // Ensure it's a clean number
      setPricePerItem(numericMatPrice);
      setDisplayPricePerItem(formatRupiah(numericMatPrice)); // Format the clean number

      const purchaseBufferVal = parseFloat(material.purchase_buffer_amount); // Initialize purchaseBufferAmount
      if (!isNaN(purchaseBufferVal)) {
        if (purchaseBufferVal % 1 !== 0) {
          setPurchaseBufferAmount(purchaseBufferVal);
        } else {
          setPurchaseBufferAmount(parseInt(purchaseBufferVal, 10));
        }
      } else {
        setPurchaseBufferAmount('');
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

      // Initialize rawStockPrice (numeric) and displayRawStockPrice (formatted)
      const matRawStockPrice = material.raw_stock_price ?? '';
      const numericRawStockPrice = Number(matRawStockPrice); // Ensure it's a clean number
      setRawStockPrice(numericRawStockPrice);
      setDisplayRawStockPrice(formatRupiah(numericRawStockPrice)); // Format the clean number


      setError(null);
      fetchUnits();
    }
  }, [isOpen, material]);

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

  const handlePricePerItemChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = parseRupiah(rawValue); // Get the pure number
    setPricePerItem(numericValue); // Store the pure number
    // For intermediate typing, we can just show the raw numbers
    setDisplayPricePerItem(rawValue); // Temporarily display what user types
  };

  const handlePricePerItemBlur = () => {
    // On blur, format the stored numeric value for display
    setDisplayPricePerItem(formatRupiah(pricePerItem));
  };

  const handleRawStockPriceChange = (e) => {
    const rawValue = e.target.value;
    const numericValue = parseRupiah(rawValue);
    setRawStockPrice(numericValue);
    setDisplayRawStockPrice(rawValue);
  };

  const handleRawStockPriceBlur = () => {
    setDisplayRawStockPrice(formatRupiah(rawStockPrice));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !unit) {
      setError("Nama dan satuan tidak boleh kosong.");
      return;
    }
    if (parseFloat(stokMinimum) < 0 || parseFloat(purchaseBufferAmount) < 0 || pricePerItem < 0 || rawStockPrice < 0) { // Add pricePerItem validation
      setError("Nilai numerik tidak boleh negatif.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/raw-materials/${material.id}`, {
        name,
        unit,
        stok_minimum: parseFloat(stokMinimum) || 0,
        price_per_item: pricePerItem || 0, // Use the numeric pricePerItem

        purchase_buffer_amount: parseFloat(purchaseBufferAmount) || 0, // Include purchase_buffer_amount in the update
        current_stock: parseFloat(currentStock) || 0,
        menu_stock: parseFloat(menuStock) || 0, // Include menu_stock in the update
        raw_stock_price: rawStockPrice || 0, // Use the numeric rawStockPrice
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
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
            <select
              id="unit"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
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
            <label htmlFor="purchaseBufferAmount" className="block text-muted-foreground text-sm font-bold mb-2">Jumlah Buffer Pembelian</label>
            <input
              type="number"
              id="purchaseBufferAmount"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={purchaseBufferAmount}
              onChange={(e) => setPurchaseBufferAmount(e.target.value)}
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="pricePerItem" className="block text-muted-foreground text-sm font-bold mb-2">Harga Stok Menu</label>
            <input
              type="text" // Changed to text
              id="pricePerItem"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={displayPricePerItem} // Use display state
              onChange={handlePricePerItemChange} // Use custom handler
              onBlur={handlePricePerItemBlur} // Add onBlur for final formatting
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="rawStockPrice" className="block text-muted-foreground text-sm font-bold mb-2">Harga Stok Mentah</label>
            <input
              type="text" // Changed to text
              id="rawStockPrice"
              className="appearance-none bg-input border-border rounded w-full py-2 px-3 text-foreground leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50"
              value={displayRawStockPrice} // Use display state
              onChange={handleRawStockPriceChange} // Use custom handler
              onBlur={handleRawStockPriceBlur} // Add onBlur for final formatting
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
      </div >
    </div >
  );
};

export default EditRawMaterialModal;