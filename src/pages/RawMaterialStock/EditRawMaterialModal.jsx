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

  const handleBackdropClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const handleCloseClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-[1001] p-0 lg:p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      {/* Premium Modal Container */}
      <div
        className="relative bg-white dark:bg-slate-900 w-full lg:max-w-2xl h-full lg:h-auto lg:max-h-[90vh] flex flex-col overflow-hidden lg:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom lg:slide-in-from-bottom-0 duration-500"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Premium Header with Icon */}
        <div className="relative bg-[#118eea] p-6 lg:p-8 shrink-0">

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
                  <path d="M10 12h4"></path>
                  <path d="M10 16h4"></path>
                </svg>
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-tight leading-tight">
                  Edit Bahan
                </h2>
                <p className="text-sm font-bold text-white/80 tracking-wide">
                  {material.name}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseClick}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 transition-all active:scale-90"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-6">

            {/* Section: Info Dasar */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 dark:text-blue-400">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Info Dasar</h3>
              </div>

              {/* Nama Bahan */}
              <div>
                <label htmlFor="name" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Nama Bahan
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Satuan */}
              <div>
                <label htmlFor="unit" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  Satuan
                </label>
                <div className="relative">
                  <select
                    id="unit"
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 pr-12 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    required
                  >
                    <option value="">Pilih Satuan</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                  {/* Custom Dropdown Arrow */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                      <path d="m6 9 6 6 6-6"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Stok */}
            <div className="space-y-4 pt-4 border-t-2 border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"></path>
                  </svg>
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Manajemen Stok</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Stok Mentah */}
                <div>
                  <label htmlFor="currentStock" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Stok Mentah
                  </label>
                  <input
                    type="number"
                    id="currentStock"
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    value={currentStock}
                    onChange={(e) => setCurrentStock(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                {/* Stok Menu */}
                <div>
                  <label htmlFor="menuStock" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Stok Menu
                  </label>
                  <input
                    type="number"
                    id="menuStock"
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    value={menuStock}
                    onChange={(e) => setMenuStock(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                {/* Stok Minimum */}
                <div>
                  <label htmlFor="stokMinimum" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Stok Minimum
                  </label>
                  <input
                    type="number"
                    id="stokMinimum"
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 transition-all"
                    value={stokMinimum}
                    onChange={(e) => setStokMinimum(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                {/* Buffer Pembelian */}
                <div>
                  <label htmlFor="purchaseBufferAmount" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Buffer Beli
                  </label>
                  <input
                    type="number"
                    id="purchaseBufferAmount"
                    className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                    value={purchaseBufferAmount}
                    onChange={(e) => setPurchaseBufferAmount(e.target.value)}
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section: Harga */}
            <div className="space-y-4 pt-4 border-t-2 border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                    <line x1="12" x2="12" y1="2" y2="22"></line>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                  </svg>
                </div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Informasi Harga</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Harga Stok Menu */}
                <div>
                  <label htmlFor="pricePerItem" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Harga Stok Menu
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                    <input
                      type="text"
                      id="pricePerItem"
                      className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                      value={displayPricePerItem}
                      onChange={handlePricePerItemChange}
                      onBlur={handlePricePerItemBlur}
                      required
                    />
                  </div>
                </div>

                {/* Harga Stok Mentah */}
                <div>
                  <label htmlFor="rawStockPrice" className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    Harga Stok Mentah
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                    <input
                      type="text"
                      id="rawStockPrice"
                      className="w-full bg-gray-50 dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-gray-900 dark:text-white font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      value={displayRawStockPrice}
                      onChange={handleRawStockPriceChange}
                      onBlur={handleRawStockPriceBlur}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-4 flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-600 dark:text-rose-400 shrink-0">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path>
                  <path d="M12 9v4"></path>
                  <path d="M12 17h.01"></path>
                </svg>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{error}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-slate-900 border-t-2 border-gray-100 dark:border-slate-800 p-4 lg:p-8 flex gap-2 lg:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-black py-3 lg:py-4 rounded-2xl uppercase tracking-wider text-xs lg:text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-black py-3 lg:py-4 rounded-2xl uppercase tracking-wider text-xs lg:text-sm shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                    <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
                    <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
                  </svg>
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRawMaterialModal;