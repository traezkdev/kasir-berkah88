import React, { useState, useEffect, useMemo, useCallback } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMinus, FiTrash2, FiDollarSign, FiShoppingCart, FiXCircle, FiCheck, FiList, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import { Checkbox } from '../../components/ui/Checkbox';
import OptionSelectionModal from './components/OptionSelectionModal';
import NavigationHeader from '../../components/ui/NavigationHeader';
import { useTheme } from '../../contexts/ThemeContext';

const apiUrl = import.meta.env.VITE_API_URL;

const getCartItemId = (item, options) => {
  if (!options || options.length === 0) {
    return item.id;
  }
  const optionIds = options.map(o => o.id).sort().join('-');
  return `${item.id}-${optionIds}`;
};

export default function CashierDashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cashPaid, setCashPaid] = useState(0);
  const [ppnRate, setPpnRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('Dasbor Kasir');
  const [ignoreStock, setIgnoreStock] = useState(false);
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    toast.success('Anda telah berhasil logout.');
  };

  const requestLogoutConfirmation = () => {
    setShowLogoutConfirm(true);
  };

  const handleResetKeranjang = () => {
    setCart([]);
    setCashPaid(0);
    toast.success('Keranjang berhasil dikosongkan!');
  };

  const paymentOptions = [
    { label: 'Tunai', value: 'cash' },
    { label: 'Kartu Debit/Kredit', value: 'card' },
    { label: 'Transfer Bank', value: 'transfer' },
  ];

  const quickCashAmounts = [10000, 20000, 50000, 100000, 150000, 200000];

  const fetchIgnoreStockSetting = useCallback(async () => {
    try {
      const response = await authFetch(`${apiUrl}/api/restaurant-settings`);
      const data = await response.json();
      if (response.ok && data.message === 'success') {
        setIgnoreStock(!!data.data.ignore_stock);
      }
    } catch (error) {
      console.error("Error fetching initial ignore stock setting:", error);
    }
  }, []);

  const handleToggleIgnoreStock = async (newValue) => {
    setIgnoreStock(newValue);

    try {
      const response = await authFetch(`${apiUrl}/api/restaurant-settings/ignore-stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ignore_stock: newValue }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyinkronkan pengaturan ke server');
      }

      toast.success(newValue ? 'Mode Abaikan Stok Aktif (Global)' : 'Pengecekan Stok Aktif (Global)');
    } catch (err) {
      setIgnoreStock(!newValue);
      toast.error('Gagal memperbarui pengaturan: ' + err.message);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      fetchIgnoreStockSetting();
      const menuResponse = await authFetch(`${apiUrl}/api/menu-items/all`);
      const menuData = await menuResponse.json();
      if (menuResponse.ok) {
        setMenuItems(menuData.data);
      } else {
        throw new Error(menuData.error || 'Failed to fetch menu items');
      }

      const ppnResponse = await authFetch(`${apiUrl}/api/settings/ppn`);
      const ppnData = await ppnResponse.json();
      if (ppnResponse.ok) {
        setPpnRate(ppnData.data);
      }

      try {
        const titleResponse = await authFetch(`${apiUrl}/api/settings/cashier_dashboard_title`);
        const titleData = await titleResponse.json();
        if (titleResponse.ok) {
          setDashboardTitle(titleData.data.value);
        }
      } catch (titleErr) {
        console.error('Failed to fetch dashboard title');
      }

      const uniqueKategori = [...new Set(menuData.data.map(item => item.category))];
      setKategoriOptions(uniqueKategori);
    } catch (err) {
      setError(err.message);
      toast.error('Gagal mengambil data: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKategori = filterKategori === 'semua' || item.category === filterKategori;
      return matchesSearch && matchesKategori;
    });
  }, [menuItems, searchTerm, filterKategori]);

  const handleItemClick = (item) => {
    if (item.options && JSON.parse(item.options).length > 0) {
      setSelectedItemForOptions(item);
      setIsOptionsModalOpen(true);
    } else {
      addItemToCart(item, []);
    }
  };

  const addItemToCart = (item, selectedOptions) => {
    const cartItemId = getCartItemId(item, selectedOptions);
    const existingItem = cart.find(i => i.cartItemId === cartItemId);

    if (existingItem) {
      updateCartQuantity(cartItemId, existingItem.quantity + 1);
    } else {
      const priceWithOption = item.price + selectedOptions.reduce((sum, opt) => sum + (opt.price || 0), 0);
      setCart([...cart, { ...item, cartItemId, quantity: 1, selectedOptions, finalPrice: priceWithOption }]);
      toast.success(`${item.name} ditambahkan ke keranjang`);
    }
    setIsOptionsModalOpen(false);
  };

  const updateCartQuantity = (cartItemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cartItemId);
      return;
    }

    const cartItem = cart.find(i => i.cartItemId === cartItemId);
    const menuItem = menuItems.find(i => i.id === cartItem.id);

    if (!ignoreStock && newQuantity > menuItem.stock) {
      toast.error('Stok tidak mencukupi!');
      return;
    }

    setCart(cart.map(i => i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i));
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(i => i.cartItemId !== cartItemId));
    toast.success('Item dihapus dari keranjang');
  };

  const totalAmount = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    return subtotal + (subtotal * ppnRate);
  }, [cart, ppnRate]);

  const change = Math.max(0, cashPaid - totalAmount);

  const processTransaction = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'cash' && cashPaid < totalAmount) {
      toast.error('Uang yang dibayar kurang!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authFetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.finalPrice,
            selectedOptions: item.selectedOptions
          })),
          total: totalAmount,
          payment_method: paymentMethod,
          cash_paid: cashPaid,
          change_amount: change,
          ppn_rate: ppnRate,
          ignore_stock: ignoreStock
        }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success('Transaksi berhasil!');
        setCart([]);
        setCashPaid(0);
        fetchData();
      } else {
        throw new Error(data.error || 'Gagal memproses transaksi');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {theme === 'default' && (
        <NavigationHeader
          headerTitle={dashboardTitle}
        />
      )}

      <main className={`${theme === 'default' ? 'pt-20 lg:pt-16' : ''} pb-24 lg:pb-8 flex flex-col md:flex-row h-[calc(100vh-64px)] lg:h-[calc(100vh-64px)] overflow-hidden`}>
        {/* Menu Items Section */}
        <div className="w-full md:w-2/3 p-4 overflow-y-auto md:border-r border-border pb-24 md:pb-16 h-full">
          <Input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
            <Button onClick={() => setFilterKategori('semua')} variant={filterKategori === 'semua' ? 'default' : 'outline'} className="flex-shrink-0">Semua</Button>
            {kategoriOptions.map(k => (
              <Button key={k} onClick={() => setFilterKategori(k)} variant={filterKategori === k ? 'default' : 'outline'} className="flex-shrink-0">{k}</Button>
            ))}
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <Checkbox
              id="ignoreStock"
              checked={ignoreStock}
              onCheckedChange={handleToggleIgnoreStock}
            />
            <label htmlFor="ignoreStock" className="text-sm font-medium leading-none">Abaikan Stok</label>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden group"
                onClick={() => handleItemClick(item)}
              >
                <div className="aspect-square bg-muted">
                  <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-primary font-bold text-sm">Rp{item.price.toLocaleString('id-ID')}</p>
                    <p className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${item.stock > 0 ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                      Stok: {item.stock}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className={`fixed inset-0 z-50 bg-background md:relative md:flex md:w-1/3 flex-col ${showMobileCart ? 'flex' : 'hidden'} border-l border-border h-full transition-all duration-300`}>
          <div className="p-4 border-b border-border flex justify-between items-center bg-card">
            <h2 className="text-lg font-bold flex items-center">
              <FiShoppingCart className="mr-2" /> Keranjang
            </h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={handleResetKeranjang} className="text-destructive">
                <FiTrash2 size={20} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setShowMobileCart(false)} className="md:hidden">
                <FiXCircle size={20} />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-50">
                <FiShoppingCart size={48} className="mb-2" />
                <p>Keranjang kosong</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.cartItemId} className="bg-card border border-border p-3 rounded-xl shadow-sm">
                  <div className="flex justify-between font-bold text-sm">
                    <span>{item.name}</span>
                    <span className="text-primary">Rp{(item.finalPrice * item.quantity).toLocaleString('id-ID')}</span>
                  </div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <p className="text-[10px] text-text-secondary">
                      Opsi: {item.selectedOptions.map(o => o.name).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-3 bg-muted rounded-lg p-1">
                      <button onClick={() => updateCartQuantity(item.cartItemId, item.quantity - 1)} className="p-1 hover:bg-background rounded-md transition-colors"><FiMinus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateCartQuantity(item.cartItemId, item.quantity + 1)} className="p-1 hover:bg-background rounded-md transition-colors"><FiPlus size={14} /></button>
                    </div>
                    <button onClick={() => removeFromCart(item.cartItemId)} className="text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition-colors"><FiTrash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-card border-t border-border space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium">Rp{cart.reduce((sum, i) => sum + (i.finalPrice * i.quantity), 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">PPN ({ppnRate * 100}%)</span>
                <span className="font-medium">Rp{(cart.reduce((sum, i) => sum + (i.finalPrice * i.quantity), 0) * ppnRate).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary">Rp{totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <Select
              label="Metode Pembayaran"
              options={paymentOptions}
              value={paymentMethod}
              onChange={setPaymentMethod}
            />

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCashPaid(totalAmount)} className="col-span-3 font-bold text-xs py-2">Uang Pas</Button>
                  {quickCashAmounts.map(amt => (
                    <Button key={amt} variant="outline" size="sm" onClick={() => setCashPaid(amt)} className="text-[10px] py-1">{amt.toLocaleString('id-ID')}</Button>
                  ))}
                </div>
                <Input
                  label="Diterima"
                  type="number"
                  value={cashPaid}
                  onChange={(e) => setCashPaid(Number(e.target.value))}
                />
                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-text-secondary">Kembalian</span>
                  <span className="font-bold text-success text-lg">Rp{change.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}

            <Button
              className="w-full py-4 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              onClick={processTransaction}
              disabled={isLoading || cart.length === 0}
            >
              Proses Transaksi
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile Floating Cart Indicator */}
      {cart.length > 0 && !showMobileCart && (
        <div className="md:hidden fixed bottom-20 left-4 right-4 z-40">
          <button
            onClick={() => setShowMobileCart(true)}
            className="w-full bg-primary text-primary-foreground p-4 rounded-2xl shadow-2xl flex justify-between items-center"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <FiShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-primary">
                  {cart.length}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] opacity-80 font-medium">Lihat Keranjang</p>
                <p className="font-bold">Rp{totalAmount.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <FiCheck size={24} />
          </button>
        </div>
      )}

      {showLogoutConfirm && (
        <ConfirmationModal
          isOpen={showLogoutConfirm}
          onClose={() => setShowLogoutConfirm(false)}
          onConfirm={handleLogout}
          title="Keluar Akun"
          message="Apakah Anda yakin ingin keluar?"
          confirmText="Ya, Keluar"
          cancelText="Batal"
        />
      )}

      <OptionSelectionModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        item={selectedItemForOptions}
        onAddToCartWithOptions={addItemToCart}
      />
    </div>
  );
}
