import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Icon from '../../components/AppIcon';

const AddRawMaterialModal = ({ isOpen, onClose, onMaterialAdded, showMessage, showError }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [customUnit, setCustomUnit] = useState('pcs');
  const [pricePerItem, setPricePerItem] = useState('');
  const [standardStockPerDay, setStandardStockPerDay] = useState('');
  const [stokMinimum, setStokMinimum] = useState('');
  const [purchaseBufferAmount, setPurchaseBufferAmount] = useState('');
  const [menuStock, setMenuStock] = useState('');
  const [rawStockPrice, setRawStockPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [units, setUnits] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    if (isOpen) {
      setName('');
      setUnit('');
      setCustomUnit('pcs');
      setPricePerItem('');
      setStandardStockPerDay('');
      setStokMinimum('');
      setPurchaseBufferAmount('');
      setMenuStock('');
      setRawStockPrice('');
      setError(null);
      fetchUnits();
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
    if (parseFloat(pricePerItem) < 0 || parseFloat(standardStockPerDay) < 0 || parseFloat(stokMinimum) < 0 || parseFloat(purchaseBufferAmount) < 0 || parseFloat(menuStock) < 0 || parseFloat(rawStockPrice) < 0) {
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
        purchase_buffer_amount: parseFloat(purchaseBufferAmount) || 0,
        menu_stock: parseFloat(menuStock) || 0,
        raw_stock_price: parseFloat(rawStockPrice) || 0,
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
      showError(err.response?.data?.error || "Gagal menambahkan bahan mentah baru.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center z-[1001] p-0 lg:p-4 animate-in fade-in duration-300">
      <div
        className="relative bg-white dark:bg-slate-900 w-full lg:max-w-2xl h-full lg:h-auto lg:max-h-[90vh] flex flex-col overflow-hidden lg:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom lg:slide-in-from-bottom-0 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Premium Header */}
        <div className="relative bg-[#118eea] p-6 lg:p-8 shrink-0">
          <div className="flex items-center justify-between font-black text-white">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 text-white">
                <Icon name="PlusCircle" size={28} />
              </div>
              <div>
                <h2 className="text-xl lg:text-2xl uppercase tracking-tight leading-tight">Master Bahan</h2>
                <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-1">Tambah Mentah Baru</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center border border-white/20 transition-all active:scale-90"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950">
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8">

            {/* Section: Identitas */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                <Icon name="Info" size={16} className="text-blue-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informasi Dasar</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nama Bahan</label>
                  <input
                    type="text"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="Contoh: Ayam Broiler"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Satuan</label>
                  <div className="relative">
                    <select
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold appearance-none focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      required
                    >
                      <option value="">Pilih Satuan</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <Icon name="ChevronDown" size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Stok & Harga */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 border-b-2 border-slate-100 dark:border-slate-800 pb-2">
                <Icon name="Settings" size={16} className="text-emerald-500" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Pengaturan Stok & Harga</h3>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Stok Menu</label>
                  <input
                    type="number"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                    placeholder="0"
                    value={menuStock}
                    onChange={(e) => setMenuStock(e.target.value)}
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Stok Minimum</label>
                  <input
                    type="number"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all"
                    placeholder="10"
                    value={stokMinimum}
                    onChange={(e) => setStokMinimum(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="col-span-2 lg:col-span-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Buffer Beli</label>
                  <input
                    type="number"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                    placeholder="10"
                    value={purchaseBufferAmount}
                    onChange={(e) => setPurchaseBufferAmount(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Harga Stok Menu</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="0"
                      value={pricePerItem}
                      onChange={(e) => setPricePerItem(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Harga Stok Mentah</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rp</span>
                    <input
                      type="number"
                      className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3.5 text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      placeholder="0"
                      value={rawStockPrice}
                      onChange={(e) => setRawStockPrice(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-100 dark:border-rose-900/30 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                <Icon name="AlertTriangle" className="text-rose-500" size={20} />
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-slate-800 p-4 lg:p-8 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-black py-3 lg:py-4 rounded-2xl uppercase tracking-wider text-xs lg:text-sm transition-all active:scale-95 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#118eea] hover:bg-[#0f7dca] text-white font-black py-3 lg:py-4 rounded-2xl uppercase tracking-wider text-xs lg:text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </div>
              ) : (
                <>
                  <Icon name="PlusCircle" size={18} />
                  <span>Tambah Bahan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRawMaterialModal;