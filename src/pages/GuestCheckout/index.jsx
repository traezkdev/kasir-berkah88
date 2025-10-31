import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AppImage from '../../components/AppImage';
import Button from '../../components/ui/Button';
import { Plus, Minus, ShoppingCart, AlertCircle, Trash2, LayoutDashboard } from 'lucide-react';
import Input from '../../components/ui/Input';
import DarkModeToggle from '../../components/ui/DarkModeToggle';

const GuestCheckout = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationError, setValidationError] = useState('');
    const customerInfoRef = useRef(null);

    useEffect(() => {
        const savedCustomerName = localStorage.getItem('customerName');
        const savedCustomerAddress = localStorage.getItem('customerAddress');
        if (savedCustomerName) {
            setCustomerName(savedCustomerName);
        }
        if (savedCustomerAddress) {
            setCustomerAddress(savedCustomerAddress);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('customerName', customerName);
    }, [customerName]);

    useEffect(() => {
        localStorage.setItem('customerAddress', customerAddress);
    }, [customerAddress]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsLoggedIn(true);
        }

        const fetchMenuItems = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || '';
                const response = await fetch(`${API_BASE_URL}/api/guest/menu-items`);
                if (!response.ok) {
                    throw new Error(`Gagal memuat menu. Status: ${response.status}`);
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

    const handleClearCart = () => {
        setCart({});
    };

    const handleDeleteItemFromCart = (itemId) => {
        setCart(prevCart => {
            const newCart = { ...prevCart };
            delete newCart[itemId];
            return newCart;
        });
    };

    const calculateTotal = () => {
        return Object.entries(cart).reduce((total, [itemId, quantity]) => {
            const item = menuItems.find(menuItem => menuItem.id === itemId);
            if (!item) return total;
            const discountedPrice = item.price * (1 - (item.discount || 0));
            return total + (discountedPrice * quantity);
        }, 0);
    };

    const handleCheckout = async () => {
        if (Object.keys(cart).length === 0) {
            setValidationError('Keranjang belanja Anda kosong!');
            return;
        }
        if (!customerName.trim() || !customerAddress.trim()) {
            setValidationError('Mohon isi Nama Pelanggan dan Alamat Pengiriman.');
            return;
        }

        setValidationError(''); // Clear error on successful validation
        setIsSubmitting(true);

        const orderItems = Object.entries(cart).map(([itemId, quantity]) => {
            const item = menuItems.find(menuItem => menuItem.id === itemId);
            if (!item) {
                console.error(`Item with ID ${itemId} not found in menuItems. Skipping.`);
                return null; // Skip this item
            }
            return { id: item.id, name: item.name, price: item.price, quantity };
        }).filter(Boolean); // Remove any null entries

        if (orderItems.length === 0) {
            setValidationError('Keranjang belanja Anda kosong atau item tidak valid.');
            setIsSubmitting(false);
            return;
        }

        const orderData = {
            customer_name: customerName,
            customer_address: customerAddress,
            items: orderItems,
            total: calculateTotal(),
        };

        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';

            // 1. Submit order to backend for verification
            const response = await fetch(`${API_BASE_URL}/api/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                throw new Error('Gagal mengirim pesanan untuk verifikasi. Silakan coba lagi.');
            }

            // 2. If submission is successful, proceed to WhatsApp
            let whatsappMessage = `*Pesanan Baru*\n\n`;
            whatsappMessage += `*Nama:* ${customerName}\n`;
            whatsappMessage += `*Alamat:* ${customerAddress}\n`;
            whatsappMessage += `-----------------------------------\n`; // Separator
            whatsappMessage += "*Item Pesanan:*\n";
            orderItems.forEach(item => {
                const originalItemTotal = item.price * item.quantity;
                const discountedItemTotal = (item.price * (1 - (item.discount || 0))) * item.quantity;
                whatsappMessage += `- ${item.quantity}x ${item.name}`;
                if (item.discount > 0) {
                    whatsappMessage += ` (Diskon ${(item.discount * 100).toFixed(0)}%)`;
                    whatsappMessage += ` (Rp ${discountedItemTotal.toLocaleString('id-ID')})\n`;
                } else {
                    whatsappMessage += ` (Rp ${originalItemTotal.toLocaleString('id-ID')})\n`;
                }
            });
            whatsappMessage += `-----------------------------------\n`; // Separator
            whatsappMessage += `\n*Total: Rp ${calculateTotal().toLocaleString('id-ID')}*\n\n`;
            whatsappMessage += "Mohon untuk segera Diproses.";

            const whatsappNumber = "6285864875536"; // Consider making this configurable
            const encodedMessage = encodeURIComponent(whatsappMessage);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

            window.open(whatsappUrl, '_blank');

        } catch (error) {
            console.error("Checkout error:", error);
            alert(error.message || 'Terjadi kesalahan saat checkout.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMobileCheckout = () => {
        if (!customerName.trim() || !customerAddress.trim()) {
            customerInfoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setValidationError('Mohon isi Nama Pelanggan dan Alamat Pengiriman.');
        } else {
            handleCheckout();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center space-y-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-text-secondary">Memuat menu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <div className="bg-white border border-destructive/20 rounded-lg p-8 text-center max-w-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
                    <h2 className="text-xl font-semibold text-text-primary mb-2">Terjadi Kesalahan</h2>
                    <p className="text-text-secondary mb-6">{error}</p>
                    <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card shadow-sm sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <AppImage src="/assets/images/logoberkah88.png" alt="Logo" className="h-10 w-auto" />
                        <h1 className="text-2xl font-bold text-text-primary">Pesan Delivery</h1>
                    </div>
                    <div className="flex items-center space-x-1"> {/* This div will hold DarkModeToggle and Dashboard button */}
                        <div className="lg:hidden"> {/* DarkModeToggle for mobile */}
                            <DarkModeToggle />
                        </div>
                        {isLoggedIn && (
                            <Link to="/main-dashboard">
                                <Button variant="outline" className="flex items-center">
                                    <LayoutDashboard className="h-5 w-5 lg:hidden" /> {/* Icon for mobile */}
                                    <span className="hidden lg:inline">Dashboard</span> {/* Text for larger screens */}
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-32 lg:pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Menu Items Section */}
                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {menuItems.map(item => {
                            const quantityInCart = cart[item.id] || 0;
                            const isInCart = quantityInCart > 0;
                            const initiallyOutOfStock = item.stock === 0;
                            const effectivelyOutOfStock = item.stock <= quantityInCart;

                            return (
                                <div 
                                    key={item.id} 
                                    className={`relative bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-md dark:shadow-none overflow-hidden transform transition-transform duration-200 hover:scale-105 ${initiallyOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    
                                    {effectivelyOutOfStock ? (
                                        <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                                            Stok Habis
                                        </span>
                                    ) : (
                                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full z-10">
                                            Tersedia
                                        </span>
                                    )}
                                    
                                    <AppImage
                                        src={`${import.meta.env.VITE_API_URL}${item.image_url}`}
                                        fallbackSrc="/assets/images/no_image.png"
                                        alt={item.name}
                                        className="w-full h-32 object-cover"
                                    />
                                    {item.discount > 0 && (
                                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                                            Diskon {item.discount * 100}%
                                        </span>
                                    )}
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h3 className="text-md font-semibold text-text-primary dark:text-white flex-grow">{item.name}</h3>
                                        <p className="text-sm text-text-secondary dark:text-gray-300 mt-1">Rp {item.price.toLocaleString('id-ID')}</p>
                                        <p className="text-xs text-text-secondary dark:text-gray-300 mt-1">Stok: {item.stock}</p>
                                        
                                        <div className="mt-4">
                                            {initiallyOutOfStock ? (
                                                <Button className="w-full" disabled>Stok Habis</Button>
                                            ) : isInCart ? (
                                                <div className="flex items-center justify-center">
                                                    <Button
                                                        variant="outline" size="icon" className="rounded-r-none dark:border-gray-700"
                                                        onClick={() => handleRemoveFromCart(item)}
                                                    >
                                                        <Minus size={16} />
                                                    </Button>
                                                    <span className="px-4 py-2 border-t border-b dark:border-gray-700 w-16 text-center font-semibold">
                                                        {quantityInCart}
                                                    </span>
                                                    <Button
                                                        variant="outline" size="icon" className="rounded-l-none dark:border-gray-700"
                                                        onClick={() => handleAddToCart(item)}
                                                        disabled={effectivelyOutOfStock}
                                                    >
                                                        <Plus size={16} />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button className="w-full" onClick={() => handleAddToCart(item)}>Tambah</Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })} 
                    </div>

                    {/* Order Summary Section */}
                    <div className="lg:col-span-1 sticky top-24">
                        <div className="bg-card rounded-lg border border-border shadow-elevation-1">
                            <div className="p-4 border-b border-border flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center">
                                    <ShoppingCart className="mr-2" size={22} /> Ringkasan Pesanan
                                </h2>
                                {Object.keys(cart).length > 0 && (
                                    <Button onClick={handleClearCart} variant="ghost" size="icon" className="text-destructive rounded-full">
                                        <Trash2 size={20} />
                                    </Button>
                                )}
                            </div>
                            <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
                                {Object.keys(cart).length === 0 ? (
                                    <p className="text-text-secondary text-center py-4">Keranjang Anda kosong.</p>
                                ) : (
                                    Object.entries(cart).map(([itemId, quantity]) => {
                                        const item = menuItems.find(menuItem => menuItem.id === itemId);
                                        return item ? (
                                            <div key={itemId} className="flex justify-between items-center text-sm">
                                                <span className="text-text-primary flex-grow pr-2">{quantity}x {item.name}</span>
                                                <div className="flex items-center space-x-2">
                                                    {item.discount > 0 && (
                                                        <span className="text-sm text-muted-foreground line-through">
                                                            Rp {(item.price * quantity).toLocaleString('id-ID')}
                                                        </span>
                                                    )}
                                                    <span className="font-medium">
                                                        Rp {((item.price * (1 - (item.discount || 0))) * quantity).toLocaleString('id-ID')}
                                                    </span>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-6 w-6 text-destructive"
                                                        onClick={() => handleDeleteItemFromCart(itemId)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : null;
                                    })
                                )}
                            </div>
                            <div className="p-4 bg-background rounded-b-lg">
                                <div ref={customerInfoRef} className="space-y-4 mb-4">
                                    <Input 
                                        label="Nama Pelanggan"
                                        id="customerName"
                                        type="text"
                                        placeholder="Masukkan nama Anda"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        required
                                    />
                                    <Input 
                                        label="Alamat Pengiriman"
                                        id="customerAddress"
                                        type="text"
                                        placeholder="Masukkan alamat lengkap Anda"
                                        value={customerAddress}
                                        onChange={(e) => setCustomerAddress(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="flex justify-between items-center text-lg font-bold mt-2 pt-2 border-t">
                                    <span>Total:</span>
                                    <span>Rp {calculateTotal().toLocaleString('id-ID')}</span>
                                </div>

                                {validationError && (
                                    <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg text-sm flex items-center">
                                        <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                                        <span>{validationError}</span>
                                    </div>
                                )}

                                <Button
                                    onClick={handleCheckout}
                                    className="w-full mt-4"
                                    variant="success"
                                    disabled={Object.keys(cart).length === 0 || isSubmitting}
                                >
                                    {isSubmitting ? 'Mengirim Pesanan...' : 'Pesan via WhatsApp'}
                                </Button>
                                <p className="text-xs text-text-secondary mt-3 text-center">
                                    *Stok akan dikonfirmasi ulang via WhatsApp.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Sticky Footer for Mobile */}
            {Object.keys(cart).length > 0 && (
                <div className="lg:hidden fixed bottom-0 left-0 right-0 z-1000 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-3">
                    <div className="flex justify-between items-center max-w-7xl mx-auto">
                        <div className="flex items-center space-x-2">
                            <Button onClick={handleClearCart} variant="ghost" size="icon" className="text-destructive rounded-full">
                                <Trash2 size={20} />
                            </Button>
                            <div>
                                <p className="font-bold text-sm">{Object.values(cart).reduce((a, b) => a + b, 0)} item</p>
                                <p className="text-lg font-bold text-primary">Rp {calculateTotal().toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <Button onClick={handleMobileCheckout} variant="success">
                            <ShoppingCart className="mr-2" size={18} />
                            Pesan Sekarang
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestCheckout;
