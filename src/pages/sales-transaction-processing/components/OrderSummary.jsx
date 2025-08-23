import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const apiUrl = import.meta.env.VITE_API_URL;

const OrderSummary = ({ cart, onUpdateQuantity, onRemoveFromCart, onClearCart, onProcessPayment, isLoading }) => {
  const [ppnRate, setPpnRate] = useState(0.11); // Default PPN rate

  useEffect(() => {
    const fetchPpn = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/settings/ppn`);
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

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * ppnRate;
  const total = subtotal + tax;

  const handlePpnChange = (e) => {
    const newRate = parseFloat(e.target.value);
    if (!isNaN(newRate)) {
      setPpnRate(newRate / 100);
    }
  };

  const handleSavePpn = async () => {
    try {
      await fetch(`${apiUrl}/api/settings/ppn`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: ppnRate }),
      });
      // Maybe show a success message
    } catch (error) {
      console.error('Error saving PPN:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-text-primary mb-4">Ringkasan Pesanan</h2>
      
      {cart.length === 0 ? (
        <p className="text-text-secondary text-center py-8">Keranjang belanja kosong</p>
      ) : (
        <div className="space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-text-secondary">Rp {item.price?.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10))}
                  className="w-16 text-center border rounded-md"
                />
                <Button variant="ghost" size="icon" onClick={() => onRemoveFromCart(item.id)}>
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
                  value={(ppnRate * 100).toFixed(0)}
                  onChange={handlePpnChange}
                  className="w-16 text-center border rounded-md"
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
            <div className="flex justify-between font-bold text-lg">
              <p>Total</p>
              <p>Rp {total.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="border-t my-4"></div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onClearCart} className="w-full">Kosongkan</Button>
            <Button 
              onClick={() => onProcessPayment({ total, method: 'Tunai', ppn: ppnRate })} 
              className="w-full"
              isLoading={isLoading}
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