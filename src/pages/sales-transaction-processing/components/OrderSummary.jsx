import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

import Select from '../../../components/ui/Select'; // Import Select
import authFetch from '../../../utils/authFetch';
import { useTheme } from '../../../contexts/ThemeContext';

const apiUrl = import.meta.env.VITE_API_URL;

const OrderSummary = ({
  cart,
  menuItems,
  onUpdateQuantity,
  onRemoveFromCart,
  onClearCart,
  onProcessPayment,
  isLoading,
  isEmployeeMeal,
  setIsEmployeeMeal,
  paymentMethod,
  setPaymentMethod,
  userRole,
  ignoreStock,
  setIgnoreStock,
  isMobilePopup // New prop

}) => {
  const { theme } = useTheme();
  const [ppnRate, setPpnRate] = useState(0.11); // Default PPN rate
  const [isEditingPpn, setIsEditingPpn] = useState(false);
  const [isEditingTotal, setIsEditingTotal] = useState(false);
  const [customTotal, setCustomTotal] = useState(null);
  const [isTotalOverridden, setIsTotalOverridden] = useState(false);
  const [cashPaid, setCashPaid] = useState('');
  const [change, setChange] = useState(0);
  const [moneyShortage, setMoneyShortage] = useState(0);
  const [selectedCashOption, setSelectedCashOption] = useState('custom'); // Default to custom
  const [customCashInput, setCustomCashInput] = useState(''); // For custom input
  const [manualDiscount, setManualDiscount] = useState(0);

  useEffect(() => {
    let currentCashPaid = 0;
    if (selectedCashOption === 'custom') {
      currentCashPaid = customCashInput === '' ? '' : parseFloat(customCashInput) || 0;
    } else {
      currentCashPaid = parseFloat(selectedCashOption) || 0;
    }
    setCashPaid(currentCashPaid); // Update cashPaid state

    if (paymentMethod === 'cash' && currentCashPaid && customTotal) {
      const calculatedDifference = currentCashPaid - customTotal;
      if (calculatedDifference >= 0) {
        setChange(calculatedDifference);
        setMoneyShortage(0);
      } else {
        setChange(0);
        setMoneyShortage(Math.abs(calculatedDifference));
      }
    } else {
      setChange(0);
      setMoneyShortage(0);
    }
  }, [selectedCashOption, customCashInput, customTotal, paymentMethod]);

  useEffect(() => {
    const fetchPpn = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/settings/ppn`);
        const data = await response.json();
        if (data.message === 'success') {
          setPpnRate(data.data);
        }
      } catch (error) {
        console.error('Error fetching PPN:', error);
      }
    };
    fetchPpn();
  }, []);

  const subtotal = cart.reduce((sum, cartItem) => {
    return sum + (cartItem.finalPrice * cartItem.quantity);
  }, 0);

  // This effect calculates the manual discount when the total is overridden by the user
  useEffect(() => {
    // When cart changes, manual override is cancelled, which will trigger the 'else' block here
    if (isTotalOverridden && customTotal !== null) {
      // Reverse calculate the discount from the final total
      // customTotal = (subtotal - manualDiscount) * (1 + ppnRate)
      // => manualDiscount = subtotal - (customTotal / (1 + ppnRate))
      const derivedDiscount = subtotal - (customTotal / (1 + ppnRate));
      // Only set the discount if it's a positive value (a real discount)
      // and if the value is different, to avoid infinite loops.
      if (derivedDiscount > 0 && manualDiscount.toFixed(2) !== derivedDiscount.toFixed(2)) {
        setManualDiscount(derivedDiscount);
      } else if (derivedDiscount <= 0 && manualDiscount !== 0) {
        setManualDiscount(0);
      }
    } else {
      if (manualDiscount !== 0) {
        // If there's no override, reset the discount from this source
        setManualDiscount(0);
      }
    }
  }, [isTotalOverridden, customTotal, subtotal, ppnRate, manualDiscount]);

  // All calculations are now based on subtotal and the stateful manualDiscount
  const subtotalAfterDiscount = subtotal - manualDiscount;
  const tax = subtotalAfterDiscount > 0 ? subtotalAfterDiscount * ppnRate : 0;
  const calculatedTotal = subtotalAfterDiscount + tax;

  useEffect(() => {
    // When the cart changes, cancel any manual total override
    setIsTotalOverridden(false);
  }, [cart]);

  useEffect(() => {
    // When not manually overridden, the displayed total should follow the calculation
    if (!isTotalOverridden) {
      setCustomTotal(calculatedTotal);
    }
  }, [calculatedTotal, isTotalOverridden]);

  const paymentMethodOptions = [
    { value: 'tunai', label: 'Tunai' },
    { value: 'gojek', label: 'Gojek' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'employee_meal', label: 'Makan Karyawan' },
  ];

  const handlePaymentMethodChange = (selectedValue) => {
    setPaymentMethod(selectedValue);
    setIsEmployeeMeal(selectedValue === 'employee_meal');
  };

  const handlePpnChange = (e) => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      setPpnRate(0);
    } else {
      const newRate = parseFloat(inputValue);
      if (!isNaN(newRate)) {
        setPpnRate(newRate / 100);
      }
    }
  };

  const handleSavePpn = async () => {
    try {
      await authFetch(`${apiUrl}/api/settings/ppn`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: ppnRate }),
      });
    } catch (error) {
      console.error('Error saving PPN:', error);
    }
  };

  const isCartValid = () => {
    if (cart.length === 0) return false;

    if (ignoreStock) return true; // If ignoring stock, cart is always valid if not empty



    for (const cartItem of cart) {
      const correspondingMenuItem = menuItems.find(item => item.id === cartItem.id);
      if (!correspondingMenuItem || cartItem.quantity > correspondingMenuItem.stock) {
        return false;
      }
    }
    return true;
  };

  const [catatan, setCatatan] = useState('');

  const disablePaymentButton = isLoading || !isCartValid();

  return (
    <div className={isMobilePopup ? "pb-24" : `bg-card rounded-lg shadow-lg p-6 lg:sticky ${theme === 'admin' ? 'lg:top-4' : 'lg:top-16'}`}>
      {!isMobilePopup && <h2 className="text-xl font-bold text-foreground mb-4">Ringkasan Pesanan</h2>}

      {cart.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Keranjang belanja kosong</p>
      ) : (
        <div className={isMobilePopup ? "space-y-6" : "space-y-4"}>
          {cart.map(item => (
            <div key={item.cartItemId} className={isMobilePopup ? "flex items-center justify-between bg-gray-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-gray-100 dark:border-slate-800" : "flex items-start justify-between"}>
              <div className="flex-grow">
                <div className="flex flex-col">
                  <p className={`font-black tracking-tight ${isMobilePopup ? 'text-sm text-gray-800 dark:text-gray-100' : 'font-semibold'}`}>
                    {item.name}
                  </p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.selectedOptions.map(opt => (
                        <span key={opt.id} className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-bold uppercase transition-colors">
                          {opt.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className={`text-xs font-bold mt-1 ${isMobilePopup ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
                    Rp {item.finalPrice?.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {isMobilePopup ? (
                  <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-1 shadow-sm">
                    <button
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity - 1)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Icon name={item.quantity === 1 ? "Trash2" : "Minus"} size={14} />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-gray-800 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.cartItemId, item.quantity + 1)}
                      className="p-1.5 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Icon name="Plus" size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.cartItemId, parseInt(e.target.value, 10) || 0)}
                      className="w-16 text-center border border-input rounded-md text-foreground bg-background"
                    />
                    <Button variant="ghost" size="icon" onClick={() => onRemoveFromCart(item.cartItemId)}>
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div className={`my-6 space-y-3 ${isMobilePopup ? 'bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-3xl border border-blue-100 dark:border-blue-900/30' : 'border-t pt-4'}`}>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">Subtotal</p>
              <div className="flex-grow border-b border-dashed border-gray-200 dark:border-slate-700 mx-4"></div>
              <p className="font-bold text-gray-800 dark:text-white">Rp {subtotal.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">PPN ({`${(ppnRate * 100).toFixed(0)}%`})</p>
              <div className="flex-grow border-b border-dashed border-gray-200 dark:border-slate-700 mx-4"></div>
              <div className="flex items-center gap-2">
                {isEditingPpn ? (
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 px-1">
                    <input
                      type="number"
                      value={ppnRate * 100}
                      onChange={handlePpnChange}
                      className="w-10 text-center text-xs font-black text-gray-800 dark:text-white bg-transparent outline-none py-1"
                    />
                    <button onClick={handleSavePpn} className="text-blue-600 p-1">
                      <Icon name="Check" size={14} />
                    </button>
                  </div>
                ) : (
                  <p className="font-bold text-gray-800 dark:text-white flex items-center gap-1" onClick={() => setIsEditingPpn(true)}>
                    Rp {tax.toLocaleString('id-ID')}
                    {isMobilePopup && <Icon name="Edit3" size={12} className="opacity-40" />}
                  </p>
                )}
              </div>
            </div>
            {manualDiscount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <p className="text-red-500 font-medium whitespace-nowrap">Diskon</p>
                <div className="flex-grow border-b border-dashed border-red-100 dark:border-red-900/20 mx-4"></div>
                <p className="font-bold text-red-500">- Rp {manualDiscount.toLocaleString('id-ID')}</p>
              </div>
            )}
            <div className="pt-2 flex justify-between items-center">
              <p className="text-gray-800 dark:text-white font-black uppercase tracking-wider text-xs">Total Akhir</p>
              {isEditingTotal ? (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border-2 border-blue-500 p-1">
                  <span className="pl-2 text-xs font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    value={customTotal}
                    onChange={(e) => setCustomTotal(parseFloat(e.target.value))}
                    className="w-24 text-right text-sm font-black text-gray-800 dark:text-white bg-transparent outline-none pr-2"
                    autoFocus
                  />
                  <div className="flex border-l border-gray-100 dark:border-slate-800">
                    <button onClick={() => { setIsEditingTotal(false); setIsTotalOverridden(true); }} className="p-1.5 text-blue-600">
                      <Icon name="Check" size={16} />
                    </button>
                    <button onClick={() => { setIsEditingTotal(false); setIsTotalOverridden(false); }} className="p-1.5 text-gray-400">
                      <Icon name="X" size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTotal(true)}>
                  <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                    Rp {customTotal?.toLocaleString('id-ID')}
                  </p>
                  <Icon name="Edit2" size={14} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
          <div className="border-t my-4"></div>

          <div className={isMobilePopup ? "space-y-5 bg-gray-50 dark:bg-slate-800/30 p-5 rounded-3xl border border-gray-100 dark:border-slate-800" : "space-y-4"}>
            <div className="space-y-2">
              <label htmlFor="payment-method" className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Icon name="CreditCard" size={12} />
                Metode Pembayaran
              </label>
              <Select
                id="payment-method"
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
                className={isMobilePopup ? "h-12 rounded-xl" : ""}
              />
            </div>

            {paymentMethod === 'tunai' && (
              <div className={`space-y-3 ${isMobilePopup ? 'pt-2' : 'border-t pt-4 mt-4'}`}>
                <div className="space-y-2">
                  <label htmlFor="cash-paid-select" className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Icon name="Banknote" size={12} />
                    Nominal Tunai
                  </label>
                  <Select
                    id="cash-paid-select"
                    options={[
                      { value: 'custom', label: 'Kustom' },
                      { value: '20000', label: 'Rp 20.000' },
                      { value: '50000', label: 'Rp 50.000' },
                      { value: '100000', label: 'Rp 100.000' },
                      { value: '150000', label: 'Rp 150.000' },
                      { value: '200000', label: 'Rp 200.000' },
                      { value: '500000', label: 'Rp 500.000' },
                    ]}
                    value={selectedCashOption}
                    onChange={(value) => {
                      setSelectedCashOption(value);
                      if (value !== 'custom') {
                        setCashPaid(value);
                      }
                    }}
                    className={isMobilePopup ? "h-12 rounded-xl" : ""}
                  />

                  {selectedCashOption === 'custom' && (
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</div>
                      <input
                        id="cash-paid-custom"
                        type="text"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        placeholder="0"
                        value={customCashInput}
                        onChange={(e) => setCustomCashInput(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {parseFloat(cashPaid) > 0 && (
                  <div className="space-y-2">
                    {change > 0 && (
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                        <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-tight">Kembali</p>
                        <p className="text-sm font-black text-green-700 dark:text-green-300">Rp {change.toLocaleString('id-ID')}</p>
                      </div>
                    )}
                    {moneyShortage > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                        <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-tight">Uang Kurang</p>
                        <p className="text-sm font-black text-red-700 dark:text-red-300">Rp {moneyShortage.toLocaleString('id-ID')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className={`space-y-2 ${isMobilePopup ? 'pt-2' : 'pt-2'}`}>
              <label htmlFor="catatan" className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Icon name="FileText" size={12} />
                Catatan (Opsional)
              </label>
              <textarea
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className={`w-full border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-gray-800 dark:text-white bg-white dark:bg-slate-900 text-sm h-24 resize-none transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm ${isMobilePopup ? '' : ''}`}
                placeholder="Tambahkan catatan transaksi..."
              />
            </div>
          </div>

          <div className={isMobilePopup
            ? "fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-6 border-t border-gray-100 dark:border-slate-800 z-[200] shadow-[0_-20px_40px_rgba(0,0,0,0.1)] flex gap-3"
            : "flex gap-2 mt-4"}>
            <Button
              variant="outline"
              onClick={onClearCart}
              className={isMobilePopup ? "flex-1 h-14 rounded-2xl border-gray-200 dark:border-slate-700 font-black text-xs uppercase tracking-widest text-gray-500" : "w-full"}
            >
              Kosongkan
            </Button>
            <Button
              onClick={() => onProcessPayment({
                total: customTotal,
                ppn: tax,
                cashPaid: paymentMethod === 'tunai' ? parseFloat(cashPaid) || 0 : 0,
                change: paymentMethod === 'tunai' ? change : 0,
                manual_discount: manualDiscount,
                catatan: catatan
              })}
              className={isMobilePopup ? "flex-[2] h-14 bg-[#118EEA] hover:bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20" : "w-full"}
              loading={isLoading}
              disabled={disablePaymentButton || userRole === 'guest'}
            >
              Bayar
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrderSummary;