import React, { useState, useEffect } from 'react';
import NavigationHeader from '../../components/ui/NavigationHeader';
import BreadcrumbNavigation from '../../components/ui/BreadcrumbNavigation';
import SalesForm from './components/SalesForm';
import OrderSummary from './components/OrderSummary';
import OptionSelectionModal from './components/OptionSelectionModal'; // Import the new modal
import authFetch from '../../utils/authFetch';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Button from '../../components/ui/Button'; // Added import for Button
import { savePendingTransaction } from '../../utils/offlinePersistence';

import toast from 'react-hot-toast';
import Icon from '../../components/AppIcon';
import NotificationBell from '../../components/ui/NotificationBell';

const apiUrl = import.meta.env.VITE_API_URL;

// Helper function to create a unique ID for a cart item based on its options
const getCartItemId = (item, options) => {
  if (!options || options.length === 0) {
    return item.id;
  }
  const optionIds = options.map(o => o.id).sort().join('-');
  return `${item.id}-${optionIds}`;
};

const SalesTransactionProcessing = ({ headerTitle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmployeeMeal, setIsEmployeeMeal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('tunai');
  const [userRole, setUserRole] = useState(null);
  const [ignoreStock, setIgnoreStock] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cartSectionRef = React.useRef(null);
  const [userName, setUserName] = useState('');


  // State for the options modal
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  const fetchMenuItems = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await authFetch(`${apiUrl}/api/menu-items/all`);
      const data = await response.json();
      if (data.message === 'success') {
        setMenuItems(data.data);
      } else {
        console.error('Failed to fetch menu items:', data.error);
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems([]);
    }
  };

  useEffect(() => {
    fetchMenuItems();

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
        setUserName(decodedToken.username || decodedToken.name || 'Kasir');
      } catch (e) {
        console.error("Error decoding token in SalesTransactionProcessing:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);

    const fetchIgnoreStockSetting = async () => {
      try {
        const ignoreStockResponse = await authFetch(`${apiUrl}/api/settings/ignore_stock_sales_form`);
        const ignoreStockData = await ignoreStockResponse.json();
        if (ignoreStockResponse.ok) {
          setIgnoreStock(ignoreStockData.data.value === '1');
        }
      } catch (error) {
        console.error("Error fetching initial ignore stock setting:", error);
      }
    };
    fetchIgnoreStockSetting();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleToggleIgnoreStock = async () => {
    const newValue = !ignoreStock;
    setIgnoreStock(newValue);

    try {
      const response = await authFetch(`${apiUrl}/api/settings/ignore_stock_sales_form`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newValue ? '1' : '0' }),
      });

      if (!response.ok) {
        throw new Error('Gagal menyinkronkan pengaturan ke server');
      }

      toast.success(newValue ? 'Mode Abaikan Stok Aktif' : 'Pengecekan Stok Aktif');
    } catch (err) {
      setIgnoreStock(!newValue);
      toast.error('Gagal memperbarui pengaturan: ' + err.message);
      console.error('Terjadi kesalahan saat memperbarui pengaturan Abaikan Stok: ' + err.message);
    }
  };

  // Simplified useEffect for metrics, as it's not the focus
  useEffect(() => {
    // This effect can be simplified or removed if metrics aren't displayed here
  }, [menuItems]);

  const addItemToCart = (item, selectedOptions = []) => {
    setCart(prevCart => {
      const cartItemId = getCartItemId(item, selectedOptions);
      const existingItem = prevCart.find(cartItem => cartItem.cartItemId === cartItemId);

      // Calculate total quantity of this base item across all variations in cart
      const totalQtyInCart = prevCart
        .filter(cartItem => cartItem.id === item.id)
        .reduce((sum, cartItem) => sum + cartItem.quantity, 0);

      const itemStock = Number(item.stock);

      if (!ignoreStock && totalQtyInCart + 1 > itemStock) {
        toast.error(`Stok ${item.name} tidak mencukupi`);
        return prevCart;
      }

      const optionPriceAdjustment = selectedOptions.reduce((sum, opt) => sum + (opt.price_adjustment || 0), 0);
      const priceAfterDiscount = item.discount > 0 ? Math.round(parseFloat(item.price) * (1 - (item.discount / 100))) : parseFloat(item.price);
      const finalPrice = priceAfterDiscount + optionPriceAdjustment;

      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.cartItemId === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Add new item to cart
        const newCartItem = {
          ...item,
          cartItemId, // Unique ID for this specific item configuration
          quantity: 1,
          selectedOptions,
          basePrice: parseFloat(item.price),
          finalPrice,
        };

        return [...prevCart, newCartItem];
      }
    });
  };

  const handleItemClick = (item) => {
    // If item has options, open the modal
    if (item.options && item.options.length > 0) {
      setSelectedItemForOptions(item);
      setIsOptionsModalOpen(true);
    } else {
      // Otherwise, add directly to cart with no options
      addItemToCart(item, []);
    }
  };

  const handleDecrementItem = (cartItemId) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.cartItemId === cartItemId);
      if (!existingItem) return prevCart;

      if (existingItem.quantity === 1) {
        return prevCart.filter(item => item.cartItemId !== cartItemId);
      } else {
        return prevCart.map(item =>
          item.cartItemId === cartItemId ? { ...item, quantity: existingItem.quantity - 1 } : item
        );
      }
    });
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCart(prevCart => prevCart.filter(item => item.cartItemId !== cartItemId));
  };

  const handleUpdateQuantity = (cartItemId, quantity) => {
    if (quantity < 0) return;

    setCart(prevCart => {
      const cartItem = prevCart.find(item => item.cartItemId === cartItemId);
      const menuItem = menuItems.find(item => item.id === cartItem.id); // Original menu item for stock check

      if (!ignoreStock && menuItem && quantity > menuItem.stock) {
        console.warn(`Not enough stock for ${menuItem.name}. Available: ${menuItem.stock}`);
        return prevCart.map(item => (item.cartItemId === cartItemId ? { ...item, quantity: menuItem.stock } : item));
      } else if (quantity === 0) {
        return prevCart.filter(item => item.cartItemId !== cartItemId);
      } else {
        return prevCart.map(item => (item.cartItemId === cartItemId ? { ...item, quantity } : item));
      }
    });
  };

  const handleClearCart = () => setCart([]);

  const handleProcessPayment = async (paymentData) => {
    setIsLoading(true);

    const transactionItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.finalPrice, // Use the final price per item
      basePrice: item.basePrice, // Include basePrice for receipt display
      discount: item.discount,   // Include discount for receipt display
      options: item.selectedOptions.map(opt => ({ name: opt.name, price_adjustment: opt.price_adjustment }))
    }));

    const transaction = {
      items: transactionItems,
      total: paymentData.total,
      ppn: paymentData.ppn,
      isEmployeeMeal,
      payment_method: paymentMethod,
      ignoreStock,
      cashPaid: paymentData.cashPaid,
      change: paymentData.change,
      manual_discount: paymentData.manual_discount,
      catatan: paymentData.catatan,
    };

    // Check if offline
    if (!navigator.onLine) {
      try {
        await savePendingTransaction(transaction);
        alert('Anda sedang offline. Transaksi telah disimpan di perangkat ini dan akan dikirim saat koneksi tersedia kembali.');
        setCart([]);
        setIsEmployeeMeal(false);
        // We can't navigate to /receipt because the server hasn't generated an ID yet.
        // We might want a local receipt page or just go back.
        navigate('/main-dashboard');
        return;
      } catch (err) {
        console.error('Failed to save offline transaction:', err);
        alert('Gagal menyimpan transaksi offline.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    try {
      const response = await authFetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });

      const result = await response.json();
      if (result.message === 'success') {
        setCart([]);
        setIsEmployeeMeal(false);
        fetchMenuItems();
        navigate('/receipt', { state: { transaction: result.data } });
        return true; // Success
      } else {
        console.error('Failed to save transaction:', result.error);
        alert('Gagal menyimpan transaksi: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving transaction, attempting offline save:', error);
      try {
        await savePendingTransaction(transaction);
        alert('Koneksi bermasalah. Transaksi telah disimpan secara offline dan akan disinkronisasi nanti.');
        setCart([]);
        setIsEmployeeMeal(false);
        navigate('/main-dashboard');
      } catch (offlineErr) {
        alert('Gagal menyimpan transaksi. Periksa koneksi internet Anda.');
      }
    } finally {
      setIsLoading(false);
    }
    return false; // Default to false if not successful
  };

  const scrollToCart = () => {
    cartSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);

  return (
    <div className={`min-h-screen ${theme === 'default' ? 'bg-background' : 'bg-transparent'}`}>
      {/* Desktop Navigation Header */}
      <div className="hidden lg:block">
        {theme === 'default' && <NavigationHeader onToggleSidebar={() => { }} headerTitle={headerTitle} />}
      </div>

      {/* Mobile Floating Header (Native App Feel) */}
      <div
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 lg:hidden ${scrolled ? 'backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}
        style={scrolled ? { backgroundColor: 'rgba(20, 143, 234, 0.95)' } : {}}
      >
        <div className="px-6 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className={`p-2 rounded-2xl transition-all ${scrolled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white backdrop-blur-md'}`}>
            <Icon name="ChevronLeft" size={24} />
          </button>
          <div className={`text-center transition-all duration-300 ${scrolled ? 'opacity-100' : 'opacity-0'}`}>
            <h2 className="font-black text-white tracking-tight">Transaksi</h2>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell size={20} className={`${scrolled ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-white/20 text-white backdrop-blur-md'}`} />
          </div>
        </div>
      </div>

      <div className={`${theme === 'default' ? 'pt-0 lg:pt-20' : ''}`}>
        {/* Mobile Header Banner */}
        <div className="lg:hidden bg-gradient-to-br from-[#118EEA] via-[#118EEA] to-[#0A74BD] pt-20 pb-14 px-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-20%] left-[-5%] w-48 h-48 bg-blue-400/20 rounded-full blur-2xl"></div>

          {/* Decorative Background Icon */}
          <div className="absolute -right-12 -top-12 text-white/20 -rotate-12 pointer-events-none">
            <Icon name="ShoppingCart" size={200} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
                <Icon name="User" className="text-white" size={24} />
              </div>
              <div>
                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Selamat Bekerja,</p>
                <p className="text-white font-black text-lg">{userName}</p>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Ayo Mulai<br />Transaksi Baru!
            </h1>

            {/* Quick Actions Mobile Inside Banner */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => navigate('/transaksi-sederhana')}
                className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 flex items-center gap-2 active:scale-95 transition-all outline-none"
              >
                <div className="bg-white/20 p-2 rounded-xl text-white">
                  <Icon name="Zap" size={18} />
                </div>
                <span className="font-black text-[11px] text-white leading-tight text-left">Mode<br />Sederhana</span>
              </button>
              <button
                onClick={handleToggleIgnoreStock}
                className={`flex-1 p-3 rounded-2xl border flex items-center gap-2 active:scale-95 transition-all outline-none ${ignoreStock ? 'bg-red-500/20 border-red-400/30' : 'bg-white/10 border-white/20 backdrop-blur-md'}`}
              >
                <div className={`${ignoreStock ? 'bg-red-500 text-white' : 'bg-white/20 text-white'} p-2 rounded-xl`}>
                  <Icon name="Package" size={18} />
                </div>
                <span className={`font-black text-[11px] leading-tight text-left ${ignoreStock ? 'text-red-100' : 'text-white'}`}>
                  {ignoreStock ? <>Abaikan<br />Stok Aktif</> : <>Cek<br />Stok</>}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={`w-full ${theme === 'default' ? 'max-w-7xl mx-auto px-4 space-y-6 lg:pt-2' : 'px-4 lg:px-6 space-y-4 py-2'} ${cart.length > 0 ? 'pb-44' : 'pb-24'} lg:pb-20 -mt-10 lg:mt-0 relative z-20`}>
          <div className="hidden lg:block">
            <BreadcrumbNavigation />
          </div>
          <div className="hidden lg:flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
                Transaksi Penjualan
              </h1>
              <div className="w-12 h-1 bg-blue-600 rounded-full mt-2 lg:hidden"></div>
              <p className="text-xs lg:text-sm text-text-secondary mt-2 font-bold uppercase tracking-widest opacity-60">
                Proses transaksi penjualan dengan cepat dan efisien.
              </p>
            </div>
            <Button
              onClick={() => navigate('/transaksi-sederhana')}
              variant="outline"
              className="w-full md:w-auto" // Make button full width on mobile, his auto on desktop
            >
              Mode Transaksi Sederhana
            </Button>
          </div>



          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SalesForm
                menuItems={menuItems}
                onIncrementItem={handleItemClick} // Use the new handler
                onDecrementItem={handleDecrementItem}
                cart={cart}
                userRole={userRole}
                apiUrl={apiUrl}
                ignoreStock={ignoreStock}
                handleToggleIgnoreStock={handleToggleIgnoreStock}
              />
            </div>
            <div className="hidden lg:block lg:col-span-1" ref={cartSectionRef}>
              <OrderSummary
                cart={cart}
                menuItems={menuItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onProcessPayment={handleProcessPayment}
                isLoading={isLoading}
                isEmployeeMeal={isEmployeeMeal}
                setIsEmployeeMeal={setIsEmployeeMeal}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                userRole={userRole}
                ignoreStock={ignoreStock}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Cart Bar (Premium Native Look) */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-6 right-6 z-[100] md:hidden">
          <div
            onClick={() => setIsMobileSummaryOpen(true)}
            className="bg-[#118EEA] p-2.5 px-3.5 rounded-3xl shadow-2xl shadow-blue-200 dark:shadow-none border border-white/20 flex items-center justify-between gap-3 active:scale-95 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-white/20 backdrop-blur-md p-2.5 rounded-xl">
                  <Icon name="ShoppingCart" className="text-white" size={20} />
                </div>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-[22px] h-[22px] flex items-center justify-center rounded-full border-2 border-[#118EEA]">
                  {totalCartItems}
                </span>
              </div>
              <div>
                <p className="text-blue-100 text-[9px] font-bold uppercase tracking-wider mb-0">Total Bayar</p>
                <p className="text-white font-black text-base leading-tight">
                  Rp {totalCartPrice.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); handleClearCart(); }}
                className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl text-white transition-colors"
              >
                <Icon name="Trash2" size={18} />
              </button>
              <div className="h-8 w-px bg-white/20 mx-0.5"></div>
              <div className="bg-white text-[#118EEA] px-5 py-2 rounded-xl font-black text-xs uppercase tracking-tight">
                Bayar
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation (Exact Design) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 z-[100] lg:hidden">
        <nav className="flex items-center justify-between h-18 px-4 py-2">
          {[
            { path: '/main-dashboard', icon: 'LayoutDashboard', label: 'Home' },
            { path: '/transaksi', icon: 'ShoppingCart', label: 'Jual' },
            { path: '/menu-management', icon: 'Utensils', label: 'Menu' },
            { path: '/expense-tracking', icon: 'Receipt', label: 'Beban' },
            { path: '/transaction-history', icon: 'List', label: 'Riwayat' },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center transition-all duration-500 ease-in-out h-12 rounded-2xl relative group active:scale-90 ${isActive
                  ? 'flex-[2.5] bg-blue-600 dark:bg-white text-white dark:text-slate-900 px-4 shadow-lg shadow-blue-500/30 dark:shadow-white/10 hover:brightness-110'
                  : 'flex-1 text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
              >
                <div className="flex items-center gap-2 relative z-10 transition-all duration-300">
                  <Icon
                    name={item.icon}
                    size={22}
                    className={`transition-colors duration-300 ${isActive ? 'text-white dark:text-slate-900' : 'text-gray-400 dark:text-slate-500 group-hover:text-[#118EEA] dark:group-hover:text-blue-400'}`}
                  />
                  {isActive && (
                    <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                      {item.label}
                    </span>
                  )}
                </div>
                {isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-white/10 dark:bg-black/5 transition-opacity group-hover:opacity-20" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Mobile Order Summary Popup (Bottom Sheet) */}
      {isMobileSummaryOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileSummaryOpen(false)}
          ></div>
          <div className="absolute inset-0 h-full w-full bg-white dark:bg-slate-900 shadow-2xl animate-in slide-in-from-bottom-full duration-300 flex flex-col">
            <div className="sticky top-0 right-0 p-4 flex justify-between items-center bg-blue-600/95 dark:bg-blue-700/95 backdrop-blur-md z-10 border-b border-blue-700 dark:border-blue-800">
              <h3 className="font-black text-lg text-white ml-2">Ringkasan Pesanan</h3>
              <button
                onClick={() => setIsMobileSummaryOpen(false)}
                className="p-2 bg-blue-700 dark:bg-blue-600 rounded-md text-white hover:bg-blue-800 dark:hover:bg-blue-500 transition-colors"
              >
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto pb-safe">
              <OrderSummary
                cart={cart}
                menuItems={menuItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveFromCart={handleRemoveFromCart}
                onClearCart={handleClearCart}
                onProcessPayment={async (paymentData) => {
                  const success = await handleProcessPayment(paymentData);
                  if (success) setIsMobileSummaryOpen(false);
                }}
                isLoading={isLoading}
                isEmployeeMeal={isEmployeeMeal}
                setIsEmployeeMeal={setIsEmployeeMeal}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                userRole={userRole}
                ignoreStock={ignoreStock}
                isMobilePopup={true}
              />
            </div>
          </div>
        </div>
      )}

      <OptionSelectionModal
        isOpen={isOptionsModalOpen}
        onClose={() => setIsOptionsModalOpen(false)}
        item={selectedItemForOptions}
        onAddToCartWithOptions={addItemToCart}
      />
    </div>
  );
};

export default SalesTransactionProcessing;
