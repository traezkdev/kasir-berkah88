import React from 'react';
import Button from '../../../components/ui/Button';
import AppImage from '../../../components/AppImage';
import { cn } from '../../../utils/cn';
import { Plus, Minus } from 'lucide-react';

const ProductCard = ({ item, onIncrement, onDecrement, cart, userRole, apiUrl }) => {
  const itemInCart = cart.find(cartItem => cartItem.id === item.id);
  const quantityInCart = itemInCart ? itemInCart.quantity : 0;
  const effectiveStock = item.stock - quantityInCart;

  const isOutOfStock = item.stock === 0; // Base stock check for initial state
  const canIncrement = item.stock > quantityInCart;

  return (
    <div className={cn(
      "bg-card rounded-lg shadow-md overflow-hidden transform transition-transform duration-200",
      isOutOfStock && quantityInCart === 0 ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
    )}>
      <AppImage
        src={item.image_url ? `${apiUrl}${item.image_url}` : './assets/images/no_image.png'}
        alt={item.name}
        className="w-full h-32 object-cover"
      />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-text-primary flex-grow min-h-[40px]">{item.name}</h3>
        <p className="text-sm text-text-secondary">Rp {item.price?.toLocaleString('id-ID')}</p>
        <p className="text-xs text-text-secondary mt-1">Stok: {item.stock}</p>
        
        <div className="mt-4">
          {isOutOfStock && quantityInCart === 0 ? (
            <Button className="w-full" disabled>Stok Habis</Button>
          ) : quantityInCart > 0 ? (
            <div className="flex items-center justify-center">
              <Button
                variant="outline" size="icon" className="rounded-r-none h-9 w-9"
                onClick={() => onDecrement(item)}
                disabled={userRole === 'guest'}
              >
                <Minus size={16} />
              </Button>
              <span className="px-4 py-2 border-t border-b border-border h-9 w-16 text-center font-semibold flex items-center justify-center">
                {quantityInCart}
              </span>
              <Button
                variant="outline" size="icon" className="rounded-l-none h-9 w-9"
                onClick={() => onIncrement(item)}
                disabled={!canIncrement || userRole === 'guest'}
              >
                <Plus size={16} />
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="w-full" 
              onClick={() => onIncrement(item)}
              disabled={userRole === 'guest'}
            >
              Tambah
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;