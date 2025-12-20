import React from 'react';
import Icon from '../../../components/AppIcon';

const ProductCard = ({ product }) => {
    // Determine image URL
    const apiUrl = import.meta.env.VITE_API_URL;
    let imageUrl = product.image_url
        ? (product.image_url.startsWith('http') ? product.image_url : `${apiUrl}${product.image_url}`)
        : '';

    // Fallback if no image
    if (!imageUrl) {
        imageUrl = '/assets/images/no_image.png'; // Use local asset
    }

    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            {/* Image Container */}
            <div className="relative h-64 overflow-hidden">
                <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = '/assets/images/no_image.png'; }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Badges */}
                {product.is_featured === 1 && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Icon name="Star" size={12} fill="currentColor" />
                        Favorit
                    </div>
                )}
                {product.category && (
                    <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-medium px-3 py-1 rounded-full">
                        {product.category}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors line-clamp-1">
                    {product.name}
                </h3>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2 min-h-[40px]">
                    {product.description || 'Nikmati sajian istimewa ini bersama orang tercinta.'}
                </p>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Harga</span>
                        <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                            Rp {parseFloat(product.price).toLocaleString('id-ID')}
                        </span>
                    </div>

                    <button className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-purple-600 hover:text-white transition-all duration-300 flex items-center justify-center shadow-sm hover:shadow-purple-500/50">
                        <Icon name="ShoppingCart" size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
