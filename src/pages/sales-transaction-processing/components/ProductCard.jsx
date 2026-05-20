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
      "group relative flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden",
      quantityInCart > 0
        ? "border-[#118EEA] ring-2 ring-[#118EEA]/10 shadow-lg shadow-blue-500/5"
        : "border-slate-100 dark:border-slate-800",
      isOutOfStock && !ignoreStock ? "opacity-75 grayscale-[0.5]" : ""
    )}>
      {/* Top Badge Overlay */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-start pointer-events-none">
        {!!item.is_featured && (
          <div className="bg-amber-400 text-white text-[9px] font-black px-2.5 py-1 rounded-full flex items-center shadow-md uppercase tracking-widest border border-amber-300">
            <Icon name="Star" size={10} className="mr-1" fill="currentColor" /> HOT
          </div>
        )}
        {item.discount > 0 && (
          <div className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md animate-bounce">
            {Math.round(item.discount)}%
          </div>
        )}
      </div>

      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <AppImage
          src={item.image_url ? `${apiUrl}${item.image_url}` : '/assets/images/no_image.png'}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Category/Stock Info */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.stock > 10
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
            }`}>
            Stok: {item.stock}
          </div>
          {item.category && (
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{item.category}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight mb-0 line-clamp-2 min-h-[2.5rem] group-hover:text-[#118EEA] transition-colors">{item.name}</h3>

        {/* Price Section */}
        <div className="mt-auto pt-3 border-t border-slate-50 dark:border-slate-800 flex flex-col">
          {item.discount > 0 ? (
            <>
              <span className="text-[10px] text-slate-400 line-through font-bold mb-0.5">
                Rp {item.price?.toLocaleString('id-ID')}
              </span>
              <span className="text-base font-black text-rose-500 flex items-baseline gap-1">
                <span className="text-xs font-bold">Rp</span>
                {(item.price * (1 - item.discount / 100)).toLocaleString('id-ID')}
              </span>
            </>
          ) : (
            <span className="text-base font-black text-[#118EEA] flex items-baseline gap-1">
              <span className="text-xs font-bold font-black">Rp</span>
              {item.price?.toLocaleString('id-ID')}
            </span>
          )}
        </div>

        {/* Actions Button Area */}
        <div className="mt-4">
          {quantityInCart > 0 ? (
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-2xl p-1.5 border border-slate-100 dark:border-slate-700">
              <button
                onClick={() => lastItemVariationInCart && onDecrement(lastItemVariationInCart.cartItemId)}
                className="w-9 h-9 flex items-center justify-center bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 active:scale-90 transition-all"
                disabled={userRole === 'guest'}
              >
                <Minus size={16} strokeWidth={3} />
              </button>

              <div className="flex flex-col items-center leading-none">
                <span className="text-xs font-black text-slate-900 dark:text-white">{quantityInCart}</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Pc</span>
              </div>

              <button
                onClick={() => onIncrement(item)}
                className="w-9 h-9 flex items-center justify-center bg-[#118EEA] rounded-xl shadow-md text-white hover:bg-blue-600 active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
                disabled={(!canIncrement && !ignoreStock) || userRole === 'guest'}
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          ) : (isOutOfStock && !ignoreStock) ? (
            <div className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center border border-slate-200/50 dark:border-slate-700">
              Habis Terjual
            </div>
          ) : (
            <button
              className="group/btn w-full py-3 bg-[#118EEA] hover:bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-md active:scale-[0.97] transition-all flex items-center justify-center gap-2"
              onClick={() => onIncrement(item)}
              disabled={(!canIncrement && !ignoreStock) || userRole === 'guest'}
            >
              <Plus size={14} strokeWidth={3} className="group-hover/btn:rotate-90 transition-transform duration-300" />
              <span>Tambah</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;