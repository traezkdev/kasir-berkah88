import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';

const apiUrl = import.meta.env.VITE_API_URL;

const RestaurantSettingsModal = ({ isOpen, onClose, onSave, initialSettings }) => {
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantSlogan, setRestaurantSlogan] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [showStockAlert, setShowStockAlert] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && initialSettings) {
      setRestaurantName(initialSettings.restaurant_name || '');
      setRestaurantSlogan(initialSettings.restaurant_slogan || '');
      setOwnerPhone(initialSettings.owner_phone || '');
      setShowStockAlert(initialSettings.show_stock_alert === 1 || initialSettings.show_stock_alert === true);
    }
  }, [isOpen, initialSettings]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await onSave({
        restaurant_name: restaurantName,
        restaurant_slogan: restaurantSlogan,
        owner_phone: ownerPhone,
        show_stock_alert: showStockAlert ? 1 : 0
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan restoran.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002] p-4">
      <div className="bg-white rounded-lg shadow-elevation-3 max-w-md w-full dark:bg-dark-card">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon name="Store" size={24} className="text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Pengaturan Restoran</h3>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="restaurant-name" className="block text-sm font-medium text-text-primary mb-1">
                Nama Restoran
              </label>
              <Input
                id="restaurant-name"
                type="text"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="Nama Restoran Anda"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="restaurant-slogan" className="block text-sm font-medium text-text-primary mb-1">
                Slogan Restoran
              </label>
              <Input
                id="restaurant-slogan"
                type="text"
                value={restaurantSlogan}
                onChange={(e) => setRestaurantSlogan(e.target.value)}
                placeholder="Slogan Restoran Anda"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="owner-phone" className="block text-sm font-medium text-text-primary mb-1">
                Nomor WhatsApp Owner
              </label>
              <Input
                id="owner-phone"
                type="text"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full"
              />
              <p className="text-[10px] text-text-secondary mt-1">Nomor ini digunakan untuk mengirim laporan stok kritis via WhatsApp.</p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <input
                id="show-stock-alert"
                type="checkbox"
                checked={showStockAlert}
                onChange={(e) => setShowStockAlert(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
              />
              <label htmlFor="show-stock-alert" className="text-sm font-medium text-text-primary cursor-pointer">
                Aktifkan Peringatan Stok Kritis di Dashboard
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantSettingsModal;