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

  const itemStock = Number(item.stock);
  const canIncrement = itemStock > quantityInCart;
  const isOutOfStock = itemStock <= 0;

  // For decrementing, we need to target a specific cart item.
  // A reasonable default is to target the last variation of this item added to the cart.
  const lastItemVariationInCart = itemsInCart.length > 0 ? itemsInCart[itemsInCart.length - 1] : null;

  return (
    <div className={cn(
      "bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 transition-all duration-300 active:scale-95 group",
      "lg:bg-card lg:rounded-lg lg:shadow-md lg:border-transparent lg:dark:border-gray-700 lg:hover:scale-105"
    )}>
      <div className="relative">
        <AppImage
          src={item.image_url ? `${apiUrl}${item.image_url}` : './assets/images/no_image.png'}
          alt={item.name}
          className="w-full h-32 lg:h-32 object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:hidden"></div>
        {!!item.is_featured && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-yellow-600 text-[10px] font-black px-2 py-1 rounded-lg flex items-center z-10 shadow-sm border border-yellow-100">
            <Icon name="Star" size={12} className="mr-1" fill="currentColor" /> HOT
          </span>
        )}
        {item.discount > 0 && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-lg z-10 shadow-lg animate-pulse">
            -{item.discount * 100}%
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-grow relative">
        <h3 className="text-sm lg:text-md font-black text-gray-800 lg:text-text-primary flex-grow min-h-[40px] leading-tight mb-1">{item.name}</h3>
        <div className="min-h-[36px]">
          {item.discount > 0 ? (
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 line-through font-bold">
                Rp {item.price?.toLocaleString('id-ID')}
              </span>
              <span className="text-sm font-black text-red-600">
                Rp {(item.price * (1 - item.discount)).toLocaleString('id-ID')}
              </span>
            </div>
          ) : (
            <p className="text-sm font-black text-[#118EEA] lg:text-text-secondary">Rp {item.price?.toLocaleString('id-ID')}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${item.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
            Stock: {item.stock}
          </div>
        </div>

        <div className="mt-4">
          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-xl p-1 border border-gray-100">
              <button
                onClick={() => lastItemVariationInCart && onDecrement(lastItemVariationInCart.cartItemId)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 active:bg-gray-100 transition-colors"
                disabled={userRole === 'guest'}
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span className="text-sm font-black text-gray-800">
                {quantityInCart}
              </span>
              <button
                onClick={() => onIncrement(item)}
                className="w-8 h-8 flex items-center justify-center bg-[#118EEA] rounded-xl shadow-md shadow-blue-100 text-white active:bg-[#0A74BD] transition-colors"
                disabled={(!canIncrement && !ignoreStock) || userRole === 'guest'}
              >
                <Plus size={14} strokeWidth={3} />
              </button>
            </div>
          ) : (isOutOfStock && !ignoreStock) ? (
            <button className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl font-bold text-xs cursor-not-allowed" disabled>Stok Habis</button>
          ) : (
            <button
              className="w-full py-2.5 bg-[#118EEA] text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-100 active:scale-95 transition-all"
              onClick={() => onIncrement(item)}
              disabled={(!canIncrement && !ignoreStock) || userRole === 'guest'}
            >
              Tambah
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;