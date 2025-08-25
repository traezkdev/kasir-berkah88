import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import AppImage from '../../../components/AppImage';
import { cn } from '../../../utils/cn'; // Import cn utility

const ProductCard = ({ item, onAddToCart }) => {
  const [isAdding, setIsAdding] = useState(false);
  const isOutOfStock = item.stock <= 0;

  const handleClick = () => {
    setIsAdding(true);
    onAddToCart(item);
    setTimeout(() => {
      setIsAdding(false);
    }, 500); // Show feedback for 0.5 seconds
  };

  return (
    <div className={cn(
      "bg-white rounded-lg shadow-md overflow-hidden transform transition-transform duration-200",
      isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
    )}>
      <AppImage
        src={item.image_url || './assets/images/no_image.png'}
        alt={item.name}
        className="w-full h-32 object-cover"
      />
      <div className="p-4">
        <h3 className="text-md font-semibold text-text-primary">{item.name}</h3>
        <p className="text-sm text-text-secondary">Rp {item.price?.toLocaleString('id-ID')}</p>
        <p className="text-xs text-text-secondary mt-1">Stok: {item.stock}</p> {/* Display stock */}
        <Button
          size="sm"
          className="w-full mt-4"
          onClick={handleClick}
          disabled={isOutOfStock || isAdding} // Disable if out of stock or currently adding
        >
          {isAdding ? 'Ditambahkan!' : (isOutOfStock ? 'Stok Habis' : 'Tambah')} {/* Change button text */}
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;