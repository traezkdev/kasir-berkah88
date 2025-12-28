import React, { useState, useEffect, useMemo, useCallback } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select'; // Import Select component
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiMinus, FiTrash2, FiDollarSign, FiShoppingCart, FiXCircle, FiCheck, FiList, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-hot-toast'; // Corrected import
import DarkModeToggle from '../../components/ui/DarkModeToggle';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import NavigationHeader from '../../components/ui/NavigationHeader'; // Added import
import { useTheme } from '../../contexts/ThemeContext'; // Added import
import { Checkbox } from '../../components/ui/Checkbox';
import OptionSelectionModal from '../CashierDashboard/components/OptionSelectionModal'; // Import the new modal, adjust path
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
      const finalPrice = originalMenuItem.discount > 0 ? priceBeforeDiscount * (1 - originalMenuItem.discount) : priceBeforeDiscount;
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
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const change = useMemo(() => {
    return cashPaid >= totalAmount ? cashPaid - totalAmount : 0;
  }, [cashPaid, totalAmount]);

  const formatNumber = (num) => {
    return num.toLocaleString('id-ID');
  };

  const parseNumber = (str) => {
    // Remove all non-digit characters except for a comma (for decimal)
    // Then replace comma with a dot for parseFloat
    const cleanedStr = str.replace(/[^,\d]/g, '').replace(/,/g, '.');
    return parseFloat(cleanedStr);
  };

  const handleCashPaidChange = (e) => {
    const value = e.target.value;
    // Allow empty string or just "Rp" for input
    if (value === '' || value === 'Rp') {
      setCashPaid(0);
      return;
    }
    const parsedValue = parseNumber(value);
    setCashPaid(isNaN(parsedValue) ? 0 : parsedValue);
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
      const response = await authFetch(`${apiUrl}/api/transactions/`, {
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
    <div className={`flex flex-col ${theme === 'admin' ? 'h-full' : 'h-screen'} bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white no-select overflow-x-hidden transition-all duration-300`}>
      {theme === 'default' && (
        <NavigationHeader
          headerTitle={dashboardTitle}
          rightContent={
            <>
              <button
                className="md:hidden relative p-2 rounded-full bg-blue-500 text-white"
                onClick={() => setShowMobileCart(true)}
              >
                <FiShoppingCart className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              {/* Riwayat Transaksi button removed */}            </>
          }
        />
      )}

      <div className={`flex flex-1 flex-col md:flex-row overflow-hidden ${theme === 'default' ? 'pt-16' : ''}`}>
        {/* Menu Items Section */}
        <div className={`w-full ${theme === 'admin' ? 'md:flex-1' : 'md:w-2/3'} p-4 overflow-y-auto md:border-r dark:md:border-gray-700 pb-24 md:pb-16 h-full`}>
          <Input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
            <Button onClick={() => setFilterKategori('semua')} variant={filterKategori === 'semua' ? 'default' : 'outline'} className="flex-shrink-0">Semua</Button>
            {kategoriOptions.map(kategori => (
              <Button
                key={kategori}
                onClick={() => setFilterKategori(kategori)}
                variant={filterKategori === kategori ? 'default' : 'outline'}
                className="flex-shrink-0 capitalize"
              >
                {kategori}
              </Button>
            ))}
          </div>
          <div className="flex justify-end mb-4">
            <Button
              onClick={handleToggleIgnoreStock}
              variant={ignoreStock ? "destructive" : "outline"}
              className="w-full md:w-auto"
            >
              Abaikan Stok: {ignoreStock ? "Ya" : "Tidak"}
            </Button>
          </div>          {isLoading && <p>Memuat menu...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredMenuItems.map((item) => {
              const itemInCart = cart.find(cartItem => cartItem.id === item.id);
              const currentAvailableStock = item.stock - (itemInCart ? itemInCart.quantity : 0);
              const isOutOfStock = currentAvailableStock <= 0;
              const isInCart = cart.some(cartItem => cartItem.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-shadow duration-200 relative
                                      ${isOutOfStock && !ignoreStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
                                      ${isInCart ? 'border-2 border-green-500' : ''}`
                  } onClick={() => (currentAvailableStock > 0 || ignoreStock) && handleItemClick(item)}
                >
                  {isOutOfStock && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">Stok Habis</div>
                  )}
                  {!isOutOfStock && currentAvailableStock > 0 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">Tersedia</div>
                  )}
                  <img
                    src={item.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                  {item.discount > 0 && (
                    <div className="relative block left-[-0.5rem] mt-[-1.5rem] bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10 w-fit">Diskon {item.discount * 100}%</div>
                  )}
                  <h3 className="font-semibold text-lg flex justify-between items-center">
                    <span className="truncate">{item.name}</span>
                    {isInCart && (
                      <span className="ml-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full flex-shrink-0">
                        {itemInCart.quantity}
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">Rp{item.price.toLocaleString('id-ID')}</p>
                  <p className="text-sm text-gray-500">Stok: {item.stock}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Cart Section */}
        <div className={`fixed inset-0 z-50 bg-gray-50 dark:bg-gray-800 flex-col ${showMobileCart ? 'flex' : 'hidden'} md:relative md:flex ${theme === 'admin' ? 'md:w-[450px] lg:w-[500px] border-l dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl' : 'md:w-1/2 lg:w-1/3 p-4'} h-full transition-all duration-300`}>
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
            <div className="flex justify-between text-xl font-bold border-t dark:border-gray-700 pt-2">
              <span>Total:</span>
              <span>Rp{totalAmount.toLocaleString('id-ID')}</span>
            </div>

            <Select
              label="Metode Pembayaran"
              options={paymentOptions}
              value={paymentMethod}
              onChange={setPaymentMethod}
              className="mt-4 mb-2"
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
      </div>

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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-1000 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-3">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <Button onClick={handleResetKeranjang} className="text-destructive rounded-full">
                <FiTrash2 className="text-white" />
              </Button>
              <div>
                <p className="font-bold text-sm">{cart.length} item</p>
                <p className="text-lg font-bold text-primary">
                  Rp{totalAmount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowMobileCart(true)} className="bg-success text-success-foreground hover:bg-success/90">
              <FiShoppingCart className="mr-2 text-white" />
              Proses Transaksi
            </Button>          </div>
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
}