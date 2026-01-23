import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Icon from '../../../components/AppIcon';
import authFetch from '../../../utils/authFetch';
import { useCart } from '../context/CartContext';

const CustomerCart = () => {
    const navigate = useNavigate();
    const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('tunai');
    const [userData, setUserData] = useState({ username: 'Pelanggan', address: '', phone: '' });

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/api/user/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.message === 'success') {
                setUserData(result.data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);
    };

    const handleCheckout = async () => {
        if (!cart.length) return;
        setIsSubmitting(true);

        try {
            const payload = {
                customer_name: userData.username,
                customer_address: userData.address || '-',
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    options: item.selectedOptions || []
                })),
                payment_method: paymentMethod
            };

            const res = await authFetch(`${API_URL}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Gagal membuat pesanan');
            }

            toast.success('Pesanan berhasil dibuat! Menunggu konfirmasi.');
            clearCart();
            navigate('/customer/order-confirmation');

        } catch (error) {
            console.error("Checkout Error:", error);
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center pb-20">
                <div className="bg-gray-50 p-6 rounded-full mb-6">
                    <Icon name="ShoppingBag" className="w-16 h-16 text-gray-300" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Keranjang masih kosong</h2>
                <p className="text-gray-500 mb-8 max-w-xs">Yuk cari makanan kesukaanmu dan mulai buat pesanan!</p>
                <button
                    onClick={() => navigate('/customer/menu')}
                    className="bg-green-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-green-700 transition-colors w-full max-w-xs"
                >
                    Mulai Pesan
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-48 font-sans">
            {/* Header Fixed */}
            <div className="bg-white p-4 shadow-sm fixed top-0 left-0 right-0 w-full max-w-md mx-auto z-30 flex items-center gap-3">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <Icon name="ArrowLeft" className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="font-bold text-lg text-gray-800">Keranjang Pesanan</h1>
            </div>
            {/* Spacer for Fixed Header */}
            <div className="h-[72px]"></div>

            {/* Cart Items */}
            <div className="p-4 space-y-4">
                {cart.map((item) => {
                    const priceAfterDiscount = item.discount > 0 ? parseFloat(item.price) * (1 - (item.discount / 100)) : parseFloat(item.price);
                    const unitPrice = priceAfterDiscount + optionsTotal;

                    // Fallback for key and ID if migration hasn't run yet (though it should have)
                    const uniqueId = item.cartId || item.id;

                    return (
                        <div key={uniqueId} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg shrink-0 overflow-hidden">
                                {item.image_url ? (
                                    <img src={`${import.meta.env.VITE_API_URL}${item.image_url}`} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Icon name="Image" className="w-6 h-6" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm line-clamp-1">{item.name}</h4>
                                        {item.selectedOptions && item.selectedOptions.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                +{item.selectedOptions.map(o => o.name).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={() => removeFromCart(uniqueId)} className="text-gray-400 hover:text-red-500 p-1">
                                        <Icon name="Trash2" className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-sm font-semibold text-green-600">{formatCurrency(unitPrice)}</p>

                                <div className="flex justify-end items-center gap-3">
                                    <button onClick={() => updateQuantity(uniqueId, -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 active:bg-gray-100">
                                        <Icon name="Minus" className="w-3 h-3" />
                                    </button>
                                    <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(uniqueId, 1)} className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center active:scale-95 transition-transform">
                                        <Icon name="Plus" className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Payment Summary */}
            <div className="p-4 mt-2">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">Ringkasan Pembayaran</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-800">{formatCurrency(cartTotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Biaya Layanan</span>
                            <span className="text-gray-800">Rp 0</span>
                        </div>
                        <div className="border-t border-dashed border-gray-200 my-2 pt-2 flex justify-between font-bold text-base">
                            <span className="text-gray-900">Total Pembayaran</span>
                            <span className="text-green-600">{formatCurrency(cartTotal)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method (Simple) */}
            <div className="px-4 pb-4">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Metode Pembayaran</h3>
                <div className="flex gap-3">
                    <button
                        onClick={() => setPaymentMethod('tunai')}
                        className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${paymentMethod === 'tunai' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                            }`}
                    >
                        Tunai
                    </button>
                    <button
                        onClick={() => setPaymentMethod('qris')}
                        className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${paymentMethod === 'qris' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'
                            }`}
                    >
                        QRIS
                    </button>
                </div>
            </div>

            {/* Bottom Bar Fixed - Moved up to avoid nav bar overlap */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-[0_-8px_20px_rgba(0,0,0,0.1)] max-w-md mx-auto z-[60]">
                <div className="flex gap-4 items-center">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Pembayaran</p>
                        <p className="font-extrabold text-xl text-green-600 leading-none">{formatCurrency(cartTotal)}</p>
                    </div>
                    <button
                        onClick={handleCheckout}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-green-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-2"
                    >
                        {isSubmitting ? 'Memproses...' : 'Checkout Sekarang'}
                        {!isSubmitting && <Icon name="ArrowRight" className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerCart;
