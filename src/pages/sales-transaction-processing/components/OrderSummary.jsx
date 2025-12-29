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
  setIgnoreStock

}) => {
  const { theme } = useTheme();
  const [ppnRate, setPpnRate] = useState(0.11); // Default PPN rate
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
    <div className={`bg-card rounded-lg shadow-lg p-6 lg:sticky ${theme === 'admin' ? 'lg:top-4' : 'lg:top-16'}`}>
      <h2 className="text-xl font-bold text-foreground mb-4">Ringkasan Pesanan</h2>

      {cart.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Keranjang belanja kosong</p>
      ) : (
        <div className="space-y-4">
          {cart.map(item => (
            <div key={item.cartItemId} className="flex items-start justify-between">
              <div>
                <div className="flex items-baseline"> {/* Flex container for name and options */}
                  <p className="font-semibold">{item.name}</p>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="text-xs text-muted-foreground ml-2"> {/* Added ml-2 for spacing */}
                      {item.selectedOptions.map(opt => (
                        <span key={opt.id}>+ {opt.name}</span> // Changed <p> to <span> to keep them inline
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Rp {item.finalPrice?.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div className="border-t my-4"></div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <p>Subtotal</p>
              <p>Rp {subtotal.toLocaleString('id-ID')}</p>
            </div>
            <div className="flex justify-between items-center">
              <p>PPN ({`${(ppnRate * 100).toFixed(0)}%`})</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={ppnRate * 100}
                  onChange={handlePpnChange}
                  className="w-16 text-center border border-input rounded-md text-foreground bg-background"
                />
                <Button variant="ghost" size="icon" onClick={handleSavePpn}>
                  <Icon name="Save" size={16} />
                </Button>
              </div>
            </div>
            <div className="flex justify-between">
              <p></p>
              <p>Rp {tax.toLocaleString('id-ID')}</p>
            </div>
            {manualDiscount > 0 && (
              <div className="flex justify-between text-red-500">
                <p>Diskon</p>
                <p>- Rp {manualDiscount.toLocaleString('id-ID')}</p>
              </div>
            )}
            <div className="flex justify-between items-center font-bold text-lg">
              <p>Total</p>
              {isEditingTotal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={customTotal}
                    onChange={(e) => setCustomTotal(parseFloat(e.target.value))}
                    className="w-32 text-right border border-input rounded-md px-2 py-1 text-foreground bg-background"
                  />
                  <Button variant="ghost" size="icon" onClick={() => {
                    setIsEditingTotal(false);
                    setIsTotalOverridden(false); // Batalkan override
                  }}>
                    <Icon name="X" size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setIsEditingTotal(false);
                    setIsTotalOverridden(true); // Terapkan override
                  }}>
                    <Icon name="Check" size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p>Rp {customTotal?.toLocaleString('id-ID')}</p>
                  <Button variant="ghost" size="icon" onClick={() => setIsEditingTotal(true)}>
                    <Icon name="Pencil" size={16} />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="border-t my-4"></div>

          <div className="space-y-4">

            <div className="space-y-2">
              <label htmlFor="payment-method" className="text-sm font-medium text-muted-foreground">Metode Pembayaran</label>
              <Select
                id="payment-method"
                options={paymentMethodOptions}
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              />
            </div>

            {paymentMethod === 'tunai' && (
              <div className="space-y-3 border-t pt-4 mt-4">

                <div className="space-y-2">
                  <label htmlFor="cash-paid-select" className="text-sm font-medium text-muted-foreground">
                    Nominal Tunai (Opsional)
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
                        setCustomCashInput(''); // Clear custom input if a preset is selected
                      }
                    }}
                  />
                  {selectedCashOption === 'custom' && (
                    <input
                      id="cash-paid-custom"
                      type="text"
                      value={customCashInput === '' || isNaN(parseFloat(customCashInput)) ? '' : parseFloat(customCashInput).toLocaleString('id-ID')}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\./g, '');
                        setCustomCashInput(rawValue);
                      }}
                      className="w-full text-center border border-input rounded-md px-2 py-1 text-foreground bg-background mt-2"
                      placeholder="Masukkan nominal kustom"
                    />
                  )}
                </div>
                {cashPaid && (change > 0 || moneyShortage > 0) && (
                  <div className="flex justify-between items-center font-bold text-lg">
                    {change > 0 && (
                      <p className="text-green-500">Kembalian: Rp {change.toLocaleString('id-ID')}</p>
                    )}
                    {moneyShortage > 0 && (
                      <p className="text-red-500">Uang kurang: Rp {moneyShortage.toLocaleString('id-ID')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <label htmlFor="catatan" className="text-sm font-medium text-muted-foreground">Catatan (Opsional)</label>
              <textarea
                id="catatan"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-foreground bg-background text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Tambahkan catatan untuk transaksi ini..."
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onClearCart} className="w-full">Kosongkan</Button>
            <Button
              onClick={() => onProcessPayment({
                total: customTotal,
                ppn: tax,
                cashPaid: paymentMethod === 'tunai' ? parseFloat(cashPaid) || 0 : 0,
                change: paymentMethod === 'tunai' ? change : 0,
                manual_discount: manualDiscount,
                catatan: catatan
              })}
              className="w-full"
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