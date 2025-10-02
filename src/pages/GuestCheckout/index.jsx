import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppImage from '../../components/AppImage';
import Button from '../../components/ui/Button';

const GuestCheckout = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await fetch('https://api.inviteshare.my.id/api/guest/menu-items'); // Changed to 4000
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setMenuItems(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMenuItems();
    }, []);

    const handleAddToCart = (item) => {
        setCart(prevCart => ({
            ...prevCart,
            [item.id]: (prevCart[item.id] || 0) + 1
        }));
    };

    const handleRemoveFromCart = (item) => {
        setCart(prevCart => {
            const newQuantity = (prevCart[item.id] || 0) - 1;
            if (newQuantity <= 0) {
                const newCart = { ...prevCart };
                delete newCart[item.id];
                return newCart;
            }
            return { ...prevCart, [item.id]: newQuantity };
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [itemId, quantity]) => {
            const item = menuItems.find(menuItem => menuItem.id === itemId);
            return total + (item ? item.price * quantity : 0);
        }, 0);
    };

    const handleCheckout = () => {
        if (Object.keys(cart).length === 0) {
            alert('Keranjang belanja Anda kosong!');
            return;
        }

        let whatsappMessage = "Halo, saya ingin memesan:\n\n";
        Object.entries(cart).forEach(([itemId, quantity]) => {
            const item = menuItems.find(menuItem => menuItem.id === itemId);
            if (item) {
                whatsappMessage += `- ${quantity}x ${item.name} (Rp ${item.price.toLocaleString('id-ID')})\n`;
            }
        });
        whatsappMessage += `\nTotal: Rp ${calculateTotal().toLocaleString('id-ID')}\n\n`;
        whatsappMessage += "Mohon konfirmasi pesanan saya.";

        // Replace with your WhatsApp number
        const whatsappNumber = "6285864875536"; // Ganti dengan nomor WhatsApp Anda
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

    if (loading) {
        return <div className="text-center py-8">Memuat menu...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">Error: {error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center mb-8">Pesan Sekarang (Guest Checkout)</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map(item => (
                    <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                        <AppImage
                            src={`https://api.inviteshare.my.id/${item.image_url}`}
                            alt={item.name}
                            className="w-full h-48 object-cover"
                        />
                        <div className="p-4">
                            <h2 className="text-xl font-semibold mb-2">{item.name}</h2>
                            <p className="text-gray-700 mb-2">Rp {item.price.toLocaleString('id-ID')}</p>
                            <p className={`text-sm ${item.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Stok: {item.stock > 0 ? item.stock : 'Habis'}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center">
                                    <Button
                                        onClick={() => handleRemoveFromCart(item)}
                                        disabled={!cart[item.id] || cart[item.id] <= 0}
                                        className="px-3 py-1 bg-red-500 text-white rounded-l-md hover:bg-red-600 disabled:opacity-50"
                                    >
                                        -
                                    </Button>
                                    <span className="px-4 py-1 border-t border-b">
                                        {cart[item.id] || 0}
                                    </span>
                                    <Button
                                        onClick={() => handleAddToCart(item)}
                                        disabled={item.stock <= (cart[item.id] || 0)}
                                        className="px-3 py-1 bg-green-500 text-white rounded-r-md hover:bg-green-600 disabled:opacity-50"
                                    >
                                        +
                                    </Button>
                                </div>
                                <Button
                                    onClick={() => handleAddToCart(item)}
                                    disabled={item.stock <= (cart[item.id] || 0)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                                >
                                    Tambah
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 p-6 bg-blue-100 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Ringkasan Pesanan</h2>
                {Object.keys(cart).length === 0 ? (
                    <p>Keranjang belanja Anda kosong.</p>
                ) : (
                    <ul className="mb-4">
                        {Object.entries(cart).map(([itemId, quantity]) => {
                            const item = menuItems.find(menuItem => menuItem.id === itemId);
                            return item ? (
                                <li key={itemId} className="flex justify-between items-center py-2 border-b last:border-b-0">
                                    <span>{quantity}x {item.name}</span>
                                    <span>Rp {(item.price * quantity).toLocaleString('id-ID')}</span>
                                </li>
                            ) : null;
                        })}
                    </ul>
                )}
                <div className="flex justify-between items-center text-xl font-bold mt-4 pt-4 border-t-2 border-blue-300">
                    <span>Total:</span>
                    <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                </div>
                <Button
                    onClick={handleCheckout}
                    className="w-full bg-green-600 text-white py-3 rounded-md mt-6 text-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    disabled={Object.keys(cart).length === 0}
                >
                    Checkout via WhatsApp
                </Button>
                <p className="text-sm text-gray-600 mt-2 text-center">
                    *Stok yang ditampilkan adalah stok saat ini. Pesanan akan dikonfirmasi setelah Anda mengirim pesan WhatsApp.
                </p>
            </div>

            <div className="text-center mt-8">
                <Link to="/login" className="text-blue-500 hover:underline">Kembali ke Login</Link>
            </div>
        </div>
    );
};

export default GuestCheckout;
