import React from 'react';
import { ShoppingBag, Star, Zap } from 'lucide-react';

const ProductCard = ({ product }) => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const imageUrl = product.image_url ? `${apiUrl}${product.image_url}` : '/assets/images/placeholder.png';

    // Format price
    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-emerald-100 hover:border-emerald-100 transition-all duration-500 overflow-hidden flex flex-col h-full">
            {/* Image container */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {product.is_featured === 1 && (
                        <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                            <Star size={10} fill="currentColor" />
                            Favorit
                        </span>
                    )}
                    {product.promo_price && (
                        <span className="bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 backdrop-blur-md">
                            <Zap size={10} fill="currentColor" />
                            Promo
                        </span>
                    )}
                </div>

                <div className="absolute top-4 right-4 capitalize">
                    <span className="bg-white/90 backdrop-blur-md text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm border border-slate-100">
                        {product.category || 'Menu'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 flex flex-col flex-1">
                <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                    {product.name}
                </h3>
                <p className="text-slate-500 text-sm font-medium line-clamp-2 mb-6 leading-relaxed flex-1">
                    {product.description || "Nikmati kelezatan menu spesial kami yang diolah dengan bahan-bahan pilihan."}
                </p>

                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Harga</span>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                            {formatPrice(product.price)}
                        </span>
                    </div>
                    <button className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-600 hover:text-white hover:scale-110 transition-all duration-300 shadow-sm border border-emerald-100/50">
                        <ShoppingBag size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
