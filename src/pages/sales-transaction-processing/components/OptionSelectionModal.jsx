import React, { useState, useEffect } from 'react';
import Button from '../../../components/ui/Button';

const OptionSelectionModal = ({ isOpen, onClose, item, onAddToCartWithOptions }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    // When a new item is passed, default to the first option if available
    if (item && item.options && item.options.length > 0) {
      setSelectedOption(item.options[0]);
    } else {
      setSelectedOption(null);
    }
  }, [item]);

  const handleOptionChange = (option) => {
    setSelectedOption(option);
  };

  const handleConfirm = () => {
    if (selectedOption) {
      onAddToCartWithOptions(item, [selectedOption]); // Pass option as an array for consistency
    }
    onClose();
  };

  if (!isOpen || !item) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-foreground">Pilih Opsi untuk {item.name}</h2>
        
        <div className="space-y-3">
          {(item.options || []).map((option) => (
            <label
              key={option.id}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                selectedOption?.id === option.id
                  ? 'border-primary ring-2 ring-primary'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  name="menu-option"
                  checked={selectedOption?.id === option.id}
                  onChange={() => handleOptionChange(option)}
                  className="hidden" // Hide the actual radio button
                />
                <span className="font-medium text-foreground">{option.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {option.price_adjustment > 0 ? `+${formatCurrency(option.price_adjustment)}` : 'Gratis'}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleConfirm}>
            Tambah ke Keranjang
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OptionSelectionModal;
