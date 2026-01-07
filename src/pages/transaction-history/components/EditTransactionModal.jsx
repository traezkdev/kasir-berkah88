import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Icon from '../../../components/AppIcon';
import Select from '../../../components/ui/Select';
import authFetch from '../../../utils/authFetch';
import toast from 'react-hot-toast';

const EditTransactionModal = ({
  isOpen,
  onClose,
  transaction,
  onUpdateTransaction,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    timestamp: '',
    total: '0.00',
    ppn: '0.00',
    payment_method: 'Tunai',
    manual_discount: '0',
    catatan: '',
    items: [],
  });
  const [menuItems, setMenuItems] = useState([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [ppnRate, setPpnRate] = useState(0.12); // Default 12%
  const apiUrl = import.meta.env.VITE_API_URL;

  // Fetch Menu Items and PPN Rate
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menuRes, settingsRes] = await Promise.all([
          authFetch(`${apiUrl}/api/menu-items/all`),
          authFetch(`${apiUrl}/api/all-settings`)
        ]);

        const menuData = await menuRes.json();
        if (menuData.message === 'success') {
          setMenuItems(menuData.data);
        }

        const settingsData = await settingsRes.json();
        if (settingsData.message === 'success') {
          // The backend returns an object { key: value }, not an array
          if (settingsData.data && settingsData.data.ppn) {
            setPpnRate(parseFloat(settingsData.data.ppn));
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (transaction) {
      const date = new Date(transaction.timestamp);
      const offset = date.getTimezoneOffset() * 60000;
      const localDate = new Date(date.getTime() - offset);
      const formattedDate = localDate.toISOString().slice(0, 16);

      const parsedItems = Array.isArray(transaction.items)
        ? transaction.items
        : JSON.parse(transaction.items || '[]');

      const normalizePaymentMethod = (method) => {
        if (!method) return 'Tunai';
        const lower = method.toLowerCase();
        if (lower === 'cash' || lower === 'tunai') return 'Tunai';
        if (lower === 'gojek') return 'Gojek';
        if (lower === 'transfer') return 'Transfer';
        if (lower === 'makan karyawan' || lower === 'employee_meal') return 'Makan Karyawan';
        return method;
      };

      setFormData({
        timestamp: formattedDate,
        total: transaction.total.toString(),
        ppn: transaction.ppn.toString(),
        payment_method: normalizePaymentMethod(transaction.payment_method),
        manual_discount: transaction.manual_discount ? transaction.manual_discount.toString() : '0',
        catatan: transaction.catatan || '',
        items: parsedItems,
      });
    }
  }, [transaction]);

  // Recalculate only the total whenever items, PPN, or discount change
  useEffect(() => {
    if (!isOpen) return;

    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    const ppn = parseFloat(formData.ppn || 0);
    const discount = parseFloat(formData.manual_discount || 0);
    const finalTotal = subtotal + ppn - discount;

    setFormData(prev => ({
      ...prev,
      total: Math.max(0, finalTotal).toFixed(2)
    }));
  }, [formData.items, formData.manual_discount, formData.ppn, isOpen]);

  const handleRecalculatePpn = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    const newPpn = subtotal * ppnRate;
    setFormData(prev => ({ ...prev, ppn: newPpn.toFixed(2) }));
    toast.success('PPN dihitung ulang');
  };

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddItem = () => {
    if (!selectedMenuItemId) {
      toast.error('Pilih menu terlebih dahulu');
      return;
    }

    const menu = menuItems.find(m => m.id.toString() === selectedMenuItemId.toString());
    if (!menu) return;

    // Check if already in items
    const existingIndex = formData.items.findIndex(item => item.id.toString() === menu.id.toString());

    if (existingIndex !== -1) {
      const newItems = [...formData.items];
      newItems[existingIndex].quantity = parseInt(newItems[existingIndex].quantity) + 1;
      setFormData(prev => ({ ...prev, items: newItems }));
    } else {
      const newItem = {
        id: menu.id,
        name: menu.name,
        price: menu.price,
        quantity: 1
      };
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }
    setSelectedMenuItemId('');
    toast.success(`${menu.name} ditambahkan`);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleItemQtyChange = (index, newQty) => {
    const qty = parseInt(newQty);
    if (isNaN(qty) || qty < 1) return;

    const newItems = [...formData.items];
    newItems[index].quantity = qty;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.timestamp || !formData.total) {
      alert('Tanggal, waktu, dan total transaksi wajib diisi.');
      return;
    }

    const updatedTimestamp = new Date(formData.timestamp).toISOString();
    const isEmployeeMealValue = formData.payment_method === 'Makan Karyawan' ? 1 : 0;

    const dataToUpdate = {
      timestamp: updatedTimestamp,
      total: parseFloat(formData.total),
      ppn: parseFloat(formData.ppn),
      isEmployeeMeal: isEmployeeMealValue,
      payment_method: formData.payment_method,
      manual_discount: parseFloat(formData.manual_discount),
      catatan: formData.catatan,
      items: formData.items
    };

    await onUpdateTransaction(transaction.id, dataToUpdate);
    onClose();
  };

  const paymentMethodOptions = [
    { value: 'Tunai', label: 'Tunai' },
    { value: 'Gojek', label: 'Gojek' },
    { value: 'Transfer', label: 'Transfer' },
    { value: 'Makan Karyawan', label: 'Makan Karyawan' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
      <div className="bg-card rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Edit Transaksi #{transaction?.id}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name="X" size={20} />
          </Button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Item Management Section */}
          <div className="border-t border-border pt-4 mt-6">
            <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
              <Icon name="List" size={18} />
              Daftar Menu / Item
            </h3>

            {/* Existing Items List */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {formData.items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Tidak ada item dalam transaksi ini.</p>
              ) : (
                formData.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center justify-between gap-3 bg-muted/30 p-2 rounded-md border border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Rp {parseFloat(item.price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemQtyChange(index, e.target.value)}
                        className="w-16 h-8 text-center text-sm border border-input rounded-md bg-background focus:ring-1 focus:ring-primary outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      >
                        <Icon name="Trash2" size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New Item */}
            <div className="flex items-end gap-2 p-3 bg-muted/20 rounded-lg border border-dashed border-border">
              <div className="flex-1 min-w-0">
                <Select
                  label="Tambah Menu"
                  placeholder="Pilih menu..."
                  searchable
                  value={selectedMenuItemId}
                  onChange={(val) => setSelectedMenuItemId(val)}
                  options={menuItems.map(m => ({
                    value: m.id,
                    label: `${m.name} - Rp ${parseFloat(m.price).toLocaleString()}`,
                    description: `Stok: ${m.stock}`
                  }))}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                onClick={handleAddItem}
                className="h-10 mb-0.5"
                disabled={!selectedMenuItemId}
              >
                <Icon name="Plus" size={18} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
            <div>
              <Input
                label="Tanggal & Waktu"
                type="datetime-local"
                name="timestamp"
                value={formData.timestamp}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Select
                label="Metode"
                name="payment_method"
                value={formData.payment_method}
                onChange={(value) => handleSelectChange('payment_method', value)}
                options={paymentMethodOptions}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                label="Subtotal (Items)"
                value={(formData.items.reduce((sum, item) => sum + (parseFloat(item.price) * parseInt(item.quantity)), 0)).toFixed(2)}
                disabled
                className="bg-muted/50"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-foreground">PPN</label>
                <button
                  type="button"
                  onClick={handleRecalculatePpn}
                  className="text-[10px] text-primary hover:underline"
                >
                  Reset PPN ({ppnRate * 100}%)
                </button>
              </div>
              <Input
                type="number"
                name="ppn"
                value={formData.ppn}
                onChange={handleChange}
                required
                step="0.01"
              />
            </div>
            <div>
              <Input
                label="Diskon"
                type="number"
                name="manual_discount"
                value={formData.manual_discount}
                onChange={handleChange}
                step="1"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Total Akhir</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground sm:text-sm">Rp</span>
              </div>
              <input
                type="number"
                name="total"
                step="0.01"
                value={formData.total}
                onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-lg font-bold text-primary focus:ring-1 focus:ring-primary outline-none"
                required
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Dihitung otomatis berdasarkan item, tapi dapat disesuaikan manual.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-foreground">Catatan</label>
            <textarea
              name="catatan"
              value={formData.catatan}
              onChange={handleChange}
              className="w-full border border-border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm h-16 resize-none"
              placeholder="Tambahkan catatan..."
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" loading={isLoading}>
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTransactionModal;