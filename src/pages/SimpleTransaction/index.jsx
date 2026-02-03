import React, { useState, useEffect, useMemo, useCallback } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select'; // Import Select component
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMinus, FiTrash2, FiDollarSign, FiShoppingCart, FiXCircle, FiCheck, FiList, FiLogOut, FiSearch } from 'react-icons/fi';
import { toast } from 'react-hot-toast'; // Corrected import
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import NavigationHeader from '../../components/ui/NavigationHeader'; // Added import
import { useTheme } from '../../contexts/ThemeContext'; // Added import
import { Checkbox } from '../../components/ui/Checkbox';
import OptionSelectionModal from '../CashierDashboard/components/OptionSelectionModal'; // Import the new modal, adjust path
import LoadingScreen from '../../components/ui/LoadingScreen';
import { savePendingTransaction } from '../../utils/offlinePersistence';

const apiUrl = import.meta.env.VITE_API_URL;

// Helper function to create a unique ID for a cart item based on its options
const getCartItemId = (item, options) => {
  if (!options || options.length === 0) {
    return item.id;
  }
  const optionIds = options.map(o => o.id).sort().join('-');
  return `${item.id}-${optionIds}`;
};

export default function SimpleTransaction() { // Renamed component
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cashPaid, setCashPaid] = useState(0);
  const [ppnRate, setPpnRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterKategori, setFilterKategori] = useState('semua');
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('tunai'); // Default to 'tunai'
  const [showMobileCart, setShowMobileCart] = useState(false); // State for mobile cart visibility
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [dashboardTitle, setDashboardTitle] = useState('Transaksi'); // Changed default title
  const [ignoreStock, setIgnoreStock] = useState(false);
  // State for the options modal
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [selectedItemForOptions, setSelectedItemForOptions] = useState(null);
  const [manualTotal, setManualTotal] = useState(null);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const { theme } = useTheme(); // Added theme hook

  const handleToggleIgnoreStock = async () => {
    const newValue = !ignoreStock;
    setIgnoreStock(newValue); // Optimistically update local state

    try {
      const response = await authFetch(`${apiUrl}/api/settings/ignore_stock_simple_transaction`, {
        method: 'PUT', // Use PUT to update an existing setting
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newValue ? '1' : '0' }), // Send '1' or '0'
      });

      if (!response.ok) {
        // If API update fails, revert local state and show error
        setIgnoreStock(!newValue);
        const errorData = await response.json();
        toast.error(errorData.error || 'Gagal memperbarui pengaturan Abaikan Stok.');
      }
    } catch (err) {
      // If API call fails, revert local state and show error
      setIgnoreStock(!newValue);
      toast.error('Terjadi kesalahan saat memperbarui pengaturan Abaikan Stok: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // Assuming token is stored in localStorage
    navigate('/login');
    toast.success('Anda telah berhasil logout.');
  };

  const requestLogoutConfirmation = () => {
    setShowLogoutConfirm(true);
  };

  const handleResetKeranjang = () => {
    setCart([]);
    setCashPaid(0);
    setManualTotal(null);
    setIsEditingTotal(false);
    toast.success('Keranjang berhasil dikosongkan!');
  };

  const paymentOptions = [
    { label: 'Tunai', value: 'tunai' },
    { label: 'Gojek', value: 'gojek' },
    { label: 'Transfer', value: 'transfer' },
    { label: 'Makan Karyawan', value: 'employee_meal' },
  ];

  const quickCashAmounts = [10000, 20000, 50000, 100000, 150000, 200000];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch Menu Items
      const menuResponse = await authFetch(`${apiUrl}/api/menu-items/all`); // Changed to /all endpoint
      const menuData = await menuResponse.json();
      if (menuResponse.ok) {
        setMenuItems(menuData.data);
      } else {
        throw new Error(menuData.error || 'Failed to fetch menu items');
      }

      // Fetch PPN Rate
      const ppnResponse = await authFetch(`${apiUrl}/api/settings/ppn`);
      const ppnData = await ppnResponse.json();
      if (ppnResponse.ok) {
        setPpnRate(ppnData.data);
      } else {
        // Don't throw error, just use default
        console.error(ppnData.error || 'Failed to fetch PPN rate');
      }

      // Fetch Dashboard Title (Using a different setting for SimpleTransaction)
      try {
        const titleResponse = await authFetch(`${apiUrl}/api/settings/simple_transaction_title`); // Changed setting name
        const titleData = await titleResponse.json();
        if (titleResponse.ok) {
          setDashboardTitle(titleData.data.value);
        }
      } catch (titleErr) {
        // If fetching title fails, just log it and use the default title.
        console.error('Failed to fetch simple transaction title:', titleErr);
      }

      // Fetch Ignore Stock setting for Simple Transaction
      try {
        const ignoreStockResponse = await authFetch(`${apiUrl}/api/settings/ignore_stock_simple_transaction`);
        const ignoreStockData = await ignoreStockResponse.json();
        if (ignoreStockResponse.ok) {
          setIgnoreStock(ignoreStockData.data.value === '1'); // Convert '0'/'1' to boolean
        }
      } catch (err) {
        console.error('Failed to fetch ignore_stock_simple_transaction setting:', err);
      }

    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [setMenuItems, setPpnRate, setIsLoading, setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (menuItems.length > 0) {
      const uniqueCategories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
      setKategoriOptions(uniqueCategories);
    }
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => {
        if (filterKategori === 'semua') {
          return true;
        }
        return item.category === filterKategori;
      });
  }, [menuItems, searchTerm, filterKategori]);

  const addItemToCart = useCallback((item, selectedOptions = []) => {
    setCart(prevCart => {
      const cartItemId = getCartItemId(item, selectedOptions);
      const existingItem = prevCart.find(cartItem => cartItem.cartItemId === cartItemId);
      const originalMenuItem = menuItems.find(menuItem => menuItem.id === item.id);

      if (!originalMenuItem) {
        setTimeout(() => toast.error(`Item ${item.name} tidak ditemukan!`), 0);
        return prevCart;
      }

      const optionPriceAdjustment = selectedOptions.reduce((sum, opt) => sum + (opt.price_adjustment || 0), 0);
      // Assuming item.price is the base price and discount needs to be applied first
      const priceBeforeDiscount = parseFloat(originalMenuItem.price) + optionPriceAdjustment;
      const finalPrice = originalMenuItem.discount > 0 ? priceBeforeDiscount * (1 - originalMenuItem.discount / 100) : priceBeforeDiscount;
      if (existingItem) {
        if (!ignoreStock && existingItem.quantity + 1 > originalMenuItem.stock) {
          setTimeout(() => toast.error(`Stok ${originalMenuItem.name} tidak cukup! Tersedia: ${originalMenuItem.stock}`), 0);
          return prevCart;
        }
        return prevCart.map(cartItem =>
          cartItem.cartItemId === cartItemId
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        if (!ignoreStock && 1 > originalMenuItem.stock) {
          setTimeout(() => toast.error(`Stok ${originalMenuItem.name} tidak cukup! Tersedia: ${originalMenuItem.stock}`), 0);
          return prevCart;
        }
        const newCartItem = {
          ...originalMenuItem, // Use originalMenuItem to ensure all properties like discount are present
          cartItemId, // Unique ID for this specific item configuration
          quantity: 1,
          selectedOptions,
          basePrice: parseFloat(originalMenuItem.price),
          finalPrice, // Store final price after options and discount
        };
        return [...prevCart, newCartItem];
      }
    });
  }, [setCart, menuItems, ignoreStock]); // Added menuItems to dependencies

  const handleItemClick = useCallback((item) => {
    if (item.options && item.options.length > 0) {
      setSelectedItemForOptions(item);
      setIsOptionsModalOpen(true);
    } else {
      addItemToCart(item, []);
    }
  }, [addItemToCart, setSelectedItemForOptions, setIsOptionsModalOpen]); // Added setSelectedItemForOptions, setIsOptionsModalOpen to dependencies

  const updateCartQuantity = (cartItemId, newQuantity) => {
    setCart((prevCart) => {
      const itemToUpdate = prevCart.find((item) => item.cartItemId === cartItemId);
      if (!itemToUpdate) return prevCart;

      const originalMenuItem = menuItems.find(menuItem => menuItem.id === itemToUpdate.id);
      if (!originalMenuItem) return prevCart; // Should not happen

      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.cartItemId !== cartItemId);
      } else {
        if (!ignoreStock && newQuantity > originalMenuItem.stock) {
          setTimeout(() => toast.error(`Stok ${itemToUpdate.name} tidak cukup! Tersedia: ${originalMenuItem.stock}`), 0);
          return prevCart;
        }

        return prevCart.map((item) =>
          item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
        );
      }
    });
  };

  const removeFromCart = (cartItemId) => {
    setCart((prevCart) => {
      return prevCart.filter((item) => item.cartItemId !== cartItemId);
    });
  };

  const originalSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      let priceWithToppings = parseFloat(item.basePrice);
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        priceWithToppings += item.selectedOptions.reduce((sum, opt) => sum + (opt.price_adjustment || 0), 0);
      }
      return sum + priceWithToppings * item.quantity;
    }, 0);
  }, [cart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => {
      // Use item.finalPrice which already includes options and discount
      return sum + item.finalPrice * item.quantity;
    }, 0);
  }, [cart]);

  const totalDiscountAmount = useMemo(() => {
    return originalSubtotal - subtotal;
  }, [originalSubtotal, subtotal]);

  const taxAmount = useMemo(() => {
    return subtotal * ppnRate;
  }, [subtotal, ppnRate]);

  const totalAmount = useMemo(() => {
    if (manualTotal !== null) return manualTotal;
    return subtotal + taxAmount;
  }, [subtotal, taxAmount, manualTotal]);

  const change = useMemo(() => {
    return cashPaid >= totalAmount ? cashPaid - totalAmount : 0;
  }, [cashPaid, totalAmount]);

  const formatNumber = (num) => {
    return num.toLocaleString('id-ID');
  };

  const parseNumber = (str) => {
    if (!str) return 0;
    // Remove all non-digit characters except for a comma (for decimal)
    // Then replace comma with a dot for parseFloat
    const cleanedStr = str.toString().replace(/[^,\d]/g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleanedStr);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleCashPaidChange = (e) => {
    const value = e.target.value;
    // Allow empty string or just "Rp" for input
    if (value === '' || value === 'Rp') {
      setCashPaid(0);
      return;
    }
    const parsedValue = parseNumber(value);
    setCashPaid(parsedValue);
  };

  const handleManualTotalChange = (e) => {
    const value = e.target.value;
    if (value === '' || value === 'Rp') {
      setManualTotal(null);
      return;
    }
    const parsedValue = parseNumber(value);
    setManualTotal(parsedValue);
  };

  const processTransaction = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang belanja kosong!');
      return;
    }

    if (paymentMethod === 'tunai' && cashPaid < totalAmount) {
      toast.error('Jumlah pembayaran tunai kurang dari total!');
      return;
    }

    let finalCashPaid = 0;
    let finalChange = 0;

    if (paymentMethod === 'tunai') {
      finalCashPaid = cashPaid;
      finalChange = change;
    } else if (paymentMethod === 'gojek' || paymentMethod === 'transfer') {
      finalCashPaid = totalAmount; // For digital payments, assume full amount paid
      finalChange = 0;
    } else if (paymentMethod === 'employee_meal') {
      finalCashPaid = 0; // Employee meal is not a monetary transaction
      finalChange = 0;
    }

    setIsLoading(true);
    setError('');

    const transactionItems = cart.map(item => ({
      id: item.id,
      name: item.name,
      basePrice: item.basePrice, // Original base price
      price: item.finalPrice, // Store final price per item (after discount and options)
      quantity: item.quantity,
      discount: item.discount || 0, // Include discount, default to 0 if not present
      options: item.selectedOptions ? item.selectedOptions.map(opt => ({ name: opt.name, price_adjustment: opt.price_adjustment })) : [] // Include selected options
    }));

    const transactionData = {
      items: transactionItems,
      total: totalAmount,
      ppn: taxAmount,
      cashPaid: finalCashPaid,
      change: finalChange,
      payment_method: paymentMethod,
      ignoreStock: ignoreStock,
    };

    // Check if offline
    if (!navigator.onLine) {
      try {
        await savePendingTransaction(transactionData);
        toast.success('Offline: Transaksi disimpan di perangkat!');
        setCart([]);
        setCashPaid(0);
        return;
      } catch (err) {
        toast.error('Gagal menyimpan transaksi offline.');
        return;
      } finally {
        setIsLoading(false);
      }
    }

    try {
      const response = await authFetch(`${apiUrl}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Transaksi berhasil!');
        setCart([]);
        setCashPaid(0);
        fetchData(); // Refresh menu items to reflect stock changes
      } else {
        throw new Error(data.error || 'Gagal memproses transaksi');
      }
    } catch (err) {
      console.error('Network error, attempting offline save:', err);
      try {
        await savePendingTransaction(transactionData);
        toast.success('Koneksi bermasalah. Transaksi disimpan secara offline.');
        setCart([]);
        setCashPaid(0);
      } catch (offlineErr) {
        setError(err.message);
        toast.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && menuItems.length === 0 && (
        <LoadingScreen message="Menyiapkan Menu" submessage="Mengsinkronkan stok dan harga terbaru" />
      )}
      <div className={`w-full ${theme === 'default' ? 'h-screen overflow-hidden bg-gray-50' : 'h-full bg-transparent'} flex flex-col`}>
        {theme === 'default' && (
          <NavigationHeader
            headerTitle={dashboardTitle}
          />
        )}

        <main className={`${theme === 'default' ? 'pt-20 lg:pt-16 lg:pb-0' : 'lg:pb-0'} flex flex-col md:flex-row flex-1 overflow-hidden`}>
          {/* Menu Items Section */}
          <div className={`w-full ${theme === 'admin' ? 'md:flex-1 p-1 md:p-4' : 'md:w-2/3 p-4'} overflow-y-auto md:border-r dark:md:border-gray-700 pb-20 md:pb-0 scrollbar-hide`}>
            {/* Modern Search Bar */}
            <div className="relative mb-4 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary group-focus-within:text-primary transition-colors">
                <FiSearch className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Cari menu lezat..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>

            {/* Modern Category Pills */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-1 px-1">
              <button
                onClick={() => setFilterKategori('semua')}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 whitespace-nowrap
                ${filterKategori === 'semua'
                    ? 'bg-primary text-white scale-105'
                    : 'bg-white dark:bg-gray-800 text-text-secondary border border-border hover:border-primary/50'
                  }`}
              >
                Semua
              </button>
              {kategoriOptions.map(kategori => (
                <button
                  key={kategori}
                  onClick={() => setFilterKategori(kategori)}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0 capitalize whitespace-nowrap
                  ${filterKategori === kategori
                      ? 'bg-primary text-white scale-105'
                      : 'bg-white dark:bg-gray-800 text-text-secondary border border-border hover:border-primary/50'
                    }`}
                >
                  {kategori}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between mt-2 mb-6 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-border/50">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-text-secondary tracking-widest opacity-60">Status Stok</span>
                <h2 className="text-sm font-bold text-text-primary capitalize">
                  {filterKategori === 'semua' ? 'Semua Menu' : filterKategori}
                </h2>
              </div>
              <button
                onClick={handleToggleIgnoreStock}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                ${ignoreStock
                    ? 'bg-red-500 text-white shadow-lg shadow-red-200 dark:shadow-red-900/20'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-secondary hover:bg-gray-200'
                  }`}
              >
                <span className={`h-2 w-2 rounded-full animate-pulse ${ignoreStock ? 'bg-white' : 'bg-red-500'}`}></span>
                Abaikan Stok: {ignoreStock ? "Ya" : "Tidak"}
              </button>
            </div>
            {isLoading && <p>Memuat menu...</p>}
            {error && <p className="text-red-500">Error: {error}</p>}
            <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredMenuItems.map((item) => {
                const itemInCart = cart.find(cartItem => cartItem.id === item.id);
                const currentAvailableStock = item.stock - (itemInCart ? itemInCart.quantity : 0);
                const isOutOfStock = currentAvailableStock <= 0;
                const isInCart = cart.some(cartItem => cartItem.id === item.id);
                return (
                  <div
                    key={item.id}
                    className={`group bg-white dark:bg-gray-800 rounded-2xl p-3 transition-[transform,box-shadow,opacity] duration-300 relative flex flex-col h-full shadow-sm will-change-transform
                              ${isOutOfStock && !ignoreStock ? 'opacity-60 grayscale' : 'cursor-pointer hover:shadow-md hover:-translate-y-1 active:scale-95'}
                              ${isInCart ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10' : 'border border-transparent'}`
                    } onClick={() => (currentAvailableStock > 0 || ignoreStock) && handleItemClick(item)}
                  >
                    {/* Stock Badge */}
                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 items-end">
                      {isOutOfStock ? (
                        <span className="bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">Habis</span>
                      ) : (
                        item.stock < 5 && (
                          <span className="bg-orange-500/90 backdrop-blur-sm text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm uppercase tracking-tighter">Sisa {item.stock}</span>
                        )
                      )}
                    </div>

                    {/* Image Container */}
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl mb-3 bg-gray-50 dark:bg-gray-700">
                      <AppImage
                        src={item.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {/* Discount Badge */}
                      {item.discount > 0 && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-lg">
                          {Math.round(item.discount)}%
                        </div>
                      )}

                      {/* Quick Add Overlay */}
                      {!isOutOfStock && (
                        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center">
                          <div className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-[transform,opacity] duration-300">
                            <FiPlus className="text-primary w-5 h-5" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-col flex-1 px-1">
                      <h3 className="font-bold text-sm text-text-primary leading-tight mb-1 line-clamp-2 min-h-[2.5rem]">
                        {item.name}
                      </h3>

                      <div className="mt-auto pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            {item.discount > 0 && (
                              <span className="text-[10px] text-text-secondary line-through opacity-50">
                                Rp{parseFloat(item.price).toLocaleString('id-ID')}
                              </span>
                            )}
                            <p className="font-black text-primary text-sm whitespace-nowrap">
                              Rp{item.discount > 0
                                ? (parseFloat(item.price) * (1 - item.discount / 100)).toLocaleString('id-ID')
                                : parseFloat(item.price).toLocaleString('id-ID')
                              }
                            </p>
                          </div>

                          {isInCart && (
                            <div className="bg-primary text-white text-[10px] font-black h-6 w-6 flex items-center justify-center rounded-full shadow-md shadow-primary/30 animate-in zoom-in">
                              {itemInCart.quantity}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Cart Section */}
          <div className={`fixed inset-0 z-50 bg-gray-50 dark:bg-gray-800 flex-col ${showMobileCart ? 'flex' : 'hidden'} md:sticky md:top-0 md:flex ${theme === 'admin' ? 'md:w-[350px] lg:w-[380px] border-l dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl' : 'md:w-1/2 lg:w-1/3 p-4'} transition-all duration-300`}>
            <div className={`flex justify-between items-center mb-4 ${theme === 'admin' ? 'p-6 pb-0' : ''}`}>
              <h2 className="text-xl font-bold flex items-center"><FiShoppingCart className="mr-2" />Keranjang</h2>
              <div className="flex items-center space-x-2"> {/* New wrapper div */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetKeranjang}
                  className="p-2 rounded-full"
                >
                  <FiTrash2 className="h-6 w-6" />
                </Button>
                <button
                  className="md:hidden p-2 rounded-full bg-red-500 text-white"
                  onClick={() => setShowMobileCart(false)}
                >
                  <FiXCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className={`flex-1 overflow-y-auto mb-4 ${theme === 'admin' ? 'px-6' : ''}`}>
              {cart.length === 0 ? (
                <p className="text-gray-500">Keranjang kosong.</p>
              ) : (
                cart.map((item) => (
                  <div key={item.cartItemId} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm mb-2">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Opsi: {item.selectedOptions.map(opt => opt.name).join(', ')}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 dark:text-gray-400">Rp{item.finalPrice.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        className="p-1"
                      >
                        <FiMinus />
                      </Button>
                      <span className="mx-2 w-8 text-center border dark:border-gray-600 rounded-md">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        className="p-1"
                      >
                        <FiPlus />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="ml-2 p-1"
                      >
                        <FiTrash2 />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`border-t dark:border-gray-700 space-y-2 ${theme === 'admin' ? 'p-4 bg-gray-50 dark:bg-gray-800/50' : 'pt-4'}`}>
              <div className="flex justify-between text-lg font-medium">
                <span>Subtotal:</span>
                <span>Rp{formatNumber(originalSubtotal)}</span>
              </div>
              {totalDiscountAmount > 0 && (
                <div className="flex justify-between text-lg font-medium text-red-500">
                  <span>Diskon Item:</span>
                  <span>- Rp{formatNumber(totalDiscountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-medium">
                <span>PPN ({ppnRate * 100}%):</span>
                <span>Rp{taxAmount.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold border-t dark:border-gray-700 pt-2">
                <span>Total:</span>
                {isEditingTotal ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="w-32 bg-white dark:bg-gray-800 border-2 border-primary rounded-md px-2 py-1 text-right text-lg focus:outline-none"
                      value={`Rp${formatNumber(manualTotal ?? totalAmount)}`}
                      onChange={handleManualTotalChange}
                      onBlur={() => {
                        if (manualTotal === (subtotal + taxAmount)) setManualTotal(null);
                        setIsEditingTotal(false);
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingTotal(false);
                        if (e.key === 'Escape') {
                          setManualTotal(null);
                          setIsEditingTotal(false);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        setManualTotal(null);
                        setIsEditingTotal(false);
                      }}
                      className="text-red-500 hover:text-red-600"
                      title="Reset ke Otomatis"
                    >
                      <FiXCircle />
                    </button>
                  </div>
                ) : (
                  <div
                    className="group relative cursor-pointer flex items-center gap-2"
                    onClick={() => setIsEditingTotal(true)}
                    title="Klik untuk ubah total"
                  >
                    <span className={`${manualTotal !== null ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                      Rp{formatNumber(totalAmount)}
                    </span>
                    <FiPlus className="text-xs opacity-0 group-hover:opacity-50" />
                  </div>
                )}
              </div>

              <Select
                label="Metode Pembayaran"
                options={paymentOptions}
                value={paymentMethod}
                onChange={setPaymentMethod}
                className="mt-4 mb-2"
                position="top"
              />

              {paymentMethod === 'tunai' && (
                <div className="mt-4">
                  <div className={`grid ${theme === 'admin' ? 'grid-cols-3 gap-1' : 'grid-cols-2 gap-2'} mb-4`}>
                    {quickCashAmounts.map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        onClick={() => setCashPaid(amount)}
                        className={`${theme === 'admin' ? 'py-2 text-sm' : 'py-3 text-md'}`}
                        disabled={amount < totalAmount}
                      >
                        Rp{amount.toLocaleString('id-ID')}
                      </Button>
                    ))}
                    <Button
                      variant="default" // Highlight this button
                      onClick={() => setCashPaid(totalAmount)}
                      className={`py-3 text-md w-full ${theme === 'admin' ? 'col-span-3' : 'col-span-2'}`}
                      disabled={totalAmount === 0}
                    >
                      Uang Pass (Rp{formatNumber(totalAmount)})
                    </Button>
                  </div>
                  <Input
                    label="Uang Dibayar"
                    type="text"
                    value={`Rp${formatNumber(cashPaid)}`}
                    onChange={handleCashPaidChange}
                    onFocus={(e) => {
                      e.target.value = parseNumber(e.target.value).toString();
                    }}
                    onBlur={(e) => {
                      const value = parseNumber(e.target.value);
                      e.target.value = `Rp${formatNumber(value)}`;
                    }}
                    className="mb-2"
                  />
                  {cashPaid > 0 && cashPaid < totalAmount && (
                    <p className="text-sm text-red-500 mt-1">Uang kurang!</p>
                  )}
                  <div className="flex justify-between text-xl font-bold text-green-600 dark:text-green-400">
                    <span>Kembalian:</span>
                    <span>Rp{change.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={processTransaction}
                className="w-full mt-4 py-3 text-lg"
                disabled={isLoading || cart.length === 0}
              >
                <FiDollarSign className="mr-2" /> Proses Transaksi
              </Button>
            </div>
          </div>
        </main>

        {showLogoutConfirm && (
          <ConfirmationModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
            title="Konfirmasi Logout"
            message="Apakah Anda yakin ingin keluar dari akun ini?"
            confirmText="Logout"
            cancelText="Batal"
          />
        )}

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
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-widest">Bayar</span>
                <FiCheck size={24} />
              </div>
            </button>
          </div>
        )}

        <OptionSelectionModal
          isOpen={isOptionsModalOpen}
          onClose={() => setIsOptionsModalOpen(false)}
          item={selectedItemForOptions}
          onAddToCartWithOptions={addItemToCart}
        />
      </div>
    </>
  );
}
