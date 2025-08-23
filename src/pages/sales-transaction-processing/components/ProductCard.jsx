import React from 'react';
import Button from '../../../components/ui/Button';
import AppImage from '../../../components/AppImage';

const ProductCard = ({ item, onAddToCart }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-200">
      <AppImage
        src={item.image_url || './assets/images/no_image.png'}
        alt={item.name}
        className="w-full h-32 object-cover"
      />
      <div className="p-4">
        <h3 className="text-md font-semibold text-text-primary">{item.name}</h3>
        <p className="text-sm text-text-secondary">Rp {item.price?.toLocaleString('id-ID')}</p>
        <Button
          size="sm"
          className="w-full mt-4"
          onClick={() => onAddToCart(item)}
        >
          Tambah
        </Button>
      </div>
    </div>
  );
};

export default ProductCard;
