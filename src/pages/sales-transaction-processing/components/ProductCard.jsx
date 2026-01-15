import React from 'react';
import Button from '../../../components/ui/Button';
import AppImage from '../../../components/AppImage';
import { cn } from '../../../utils/cn';
import { Plus, Minus, Star } from 'lucide-react';
import Icon from '../../../components/AppIcon';

const ProductCard = ({ item, onIncrement, onDecrement, cart, userRole, apiUrl, ignoreStock }) => {
  // Calculate the total quantity of this item across all its variations in the cart
  const itemsInCart = cart.filter(cartItem => cartItem.id === item.id);
  const quantityInCart = itemsInCart.reduce((sum, cartItem) => sum + cartItem.quantity, 0);

  const canIncrement = item.stock > quantityInCart;
  const isOutOfStock = item.stock === 0;

  // For decrementing, we need to target a specific cart item.
  // A reasonable default is to target the last variation of this item added to the cart.
  const lastItemVariationInCart = itemsInCart.length > 0 ? itemsInCart[itemsInCart.length - 1] : null;

  return (
    <div className={cn(
      "bg-card rounded-lg shadow-md overflow-hidden border border-transparent dark:border-gray-700 transform transition-transform duration-200 hover:scale-105" // Always allow hover/interaction
    )}>
      <div className="relative">
        <AppImage
          src={item.image_url ? `${apiUrl}${item.image_url}` : './assets/images/no_image.png'}
          alt={item.name}
          className="w-full h-32 object-cover"
        />
        {!!item.is_featured && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center z-10">
            <Icon name="Star" size={14} className="mr-1 text-yellow-400" fill="currentColor" /> Unggulan
          </span>
        )}
        {item.discount > 0 && (
          <span className={`absolute ${!!item.is_featured ? 'top-10' : 'top-2'} right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10`}>
            Diskon {item.discount * 100}%
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md font-semibold text-text-primary flex-grow min-h-[40px]">{item.name}</h3>
        <div className="min-h-[36px]">
          {item.discount > 0 ? (
            <>
              <p className="text-xs text-gray-500 line-through">
                Rp {item.price?.toLocaleString('id-ID')}
              </p>
              <p className="text-sm font-semibold text-red-600">
                Rp {(item.price * (1 - item.discount)).toLocaleString('id-ID')}
              </p>
            </>
          ) : (
            <p className="text-sm text-text-secondary">Rp {item.price?.toLocaleString('id-ID')}</p>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-1">Stok: {item.stock}</p>

        <div className="mt-4">
          {quantityInCart > 0 ? ( // If already in cart, show quantity controls
            <div className="flex items-center justify-center">
              <Button
                variant="outline" size="icon" className="rounded-r-none h-9 w-9"
                onClick={() => lastItemVariationInCart && onDecrement(lastItemVariationInCart.cartItemId)}
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
                disabled={(!canIncrement && !ignoreStock) || userRole === 'guest'} // Respect stock limit if not ignoring
              >
                <Plus size={16} />
              </Button>
            </div>
          ) : (isOutOfStock && !ignoreStock) ? ( // If out of stock and NOT ignoring
            <Button className="w-full" disabled>Stok Habis</Button>
          ) : ( // In stock, OR ignoring stock (and not in cart yet)
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