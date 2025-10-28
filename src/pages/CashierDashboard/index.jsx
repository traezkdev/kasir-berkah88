import React, { useState, useEffect, useMemo, useCallback } from 'react';
import authFetch from '../../utils/authFetch';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select'; // Import Select component
import { FiPlus, FiMinus, FiTrash2, FiDollarSign, FiShoppingCart, FiXCircle, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import DarkModeToggle from '../../components/ui/DarkModeToggle';

const apiUrl = import.meta.env.VITE_API_URL;

const CashierDashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [cashPaid, setCashPaid] = useState(0);
  const [ppnRate, setPpnRate] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Default to 'cash'

  const paymentOptions = [
    { label: 'Tunai', value: 'cash' },
    { label: 'Kartu Debit/Kredit', value: 'card' },
    { label: 'Transfer Bank', value: 'transfer' },
    // Add more payment methods as needed
  ];

  const quickCashAmounts = [50000, 100000, 150000, 200000, 500000];

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch Menu Items
      const menuResponse = await authFetch(`${apiUrl}/api/menu-items`);
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
        throw new Error(ppnData.error || 'Failed to fetch PPN rate');
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

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [menuItems, searchTerm]);

  const addToCart = useCallback((item) => {
    if (item.stock === 0) {
      setTimeout(() => toast.error(`${item.name} stok habis!`), 0);
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        if (existingItem.quantity + 1 > item.stock) {
          setTimeout(() => toast.error(`Stok ${item.name} tidak cukup! Tersedia: ${item.stock}`), 0);
          return prevCart; // Don't update cart if stock is insufficient
        }
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
  }, [setCart]);

  const updateCartQuantity = (itemId, newQuantity) => {
    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== itemId);
      }
      return prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const removeFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
  };

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return subtotal * ppnRate;
  }, [subtotal, ppnRate]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

  const change = useMemo(() => {
    return cashPaid >= totalAmount ? cashPaid - totalAmount : 0;
  }, [cashPaid, totalAmount]);

  const handleCashPaidChange = (e) => {
    const value = parseFloat(e.target.value);
    setCashPaid(isNaN(value) ? 0 : value);
  };

  const processTransaction = async () => {
    if (cart.length === 0) {
      toast.error('Keranjang belanja kosong!');
      return;
    }

    if (paymentMethod === 'cash' && cashPaid < totalAmount) {
      toast.error('Jumlah pembayaran tunai kurang dari total!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const transactionItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const response = await authFetch(`${apiUrl}/api/transactions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: transactionItems,
          total: totalAmount,
          ppn: taxAmount,
          cashPaid: paymentMethod === 'cash' ? cashPaid : totalAmount, // If not cash, assume full payment
          change: paymentMethod === 'cash' ? change : 0, // If not cash, change is 0
          paymentMethod: paymentMethod,
          ignoreStock: false, // Assuming stock should be managed
        }),
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
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white no-select">
      <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dasbor Kasir</h1>
        <DarkModeToggle />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Menu Items Section */}
        <div className="w-2/3 p-4 overflow-y-auto border-r dark:border-gray-700">
          <Input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          {isLoading && <p>Memuat menu...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMenuItems.map((item) => {
              const isOutOfStock = item.stock === 0;
              const isInCart = cart.some(cartItem => cartItem.id === item.id);
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-shadow duration-200 relative 
                    ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'} 
                    ${isInCart ? 'border-2 border-green-500' : ''}`
                  }
                  onClick={() => !isOutOfStock && addToCart(item)}
                >
                  {isInCart && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white rounded-full p-1 z-10">
                      <FiCheck className="h-4 w-4" />
                    </div>
                  )}
                  {isOutOfStock && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">Stok Habis</div>
                  )}
                  <img
                    src={item.image_url ? `${apiUrl}${item.image_url}` : '/public/assets/images/no_image.png'}
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-md mb-2"
                  />
                  <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Rp{item.price.toLocaleString('id-ID')}</p>
                  <p className="text-sm text-gray-500">Stok: {item.stock}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Cart Section */}
        <div className="w-1/3 p-4 flex flex-col bg-gray-50 dark:bg-gray-800">
          <h2 className="text-xl font-bold mb-4 flex items-center"><FiShoppingCart className="mr-2" />Keranjang</h2>
          <div className="flex-1 overflow-y-auto mb-4">
            {cart.length === 0 ? (
              <p className="text-gray-500">Keranjang kosong.</p>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm mb-2">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rp{item.price.toLocaleString('id-ID')}</p>
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
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 p-1"
                    >
                      <FiTrash2 />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t dark:border-gray-700 pt-4 space-y-2">
            <div className="flex justify-between text-lg font-medium">
              <span>Subtotal:</span>
              <span>Rp{subtotal.toLocaleString('id-ID')}</span>
            </div>
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

            {paymentMethod === 'cash' && (
              <div className="mt-4">
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {quickCashAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => setCashPaid(amount)}
                      className="py-3 text-md"
                    >
                      Rp{amount.toLocaleString('id-ID')}
                    </Button>
                  ))}
                </div>
                <Input
                  label="Uang Dibayar"
                  type="number"
                  value={cashPaid}
                  onChange={handleCashPaidChange}
                  min="0"
                  step="any"
                  className="mb-2"
                />
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
    </div>
  );
};

export default CashierDashboard;