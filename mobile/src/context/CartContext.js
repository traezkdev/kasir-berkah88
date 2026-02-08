import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial load
    useEffect(() => {
        loadCart();
    }, []);

    const loadCart = useCallback(async () => {
        try {
            const saved = await AsyncStorage.getItem('customer_cart');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Migration: Ensure all items have cartId
                const migrated = parsed.map(item => {
                    if (!item.cartId) {
                        return {
                            ...item,
                            cartId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            selectedOptions: item.selectedOptions || []
                        };
                    }
                    return item;
                });
                setCart(migrated);
            }
        } catch (e) {
            console.error('Failed to load cart', e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Save to storage on change
    useEffect(() => {
        if (!loading) {
            AsyncStorage.setItem('customer_cart', JSON.stringify(cart));
        }
    }, [cart, loading]);

    const addToCart = useCallback((item, quantity = 1, selectedOptions = []) => {
        setCart(prev => {
            // Sort options to ensure uniqueness key is consistent
            const sortedOptions = [...selectedOptions].sort((a, b) => a.id - b.id);
            const optionsKey = JSON.stringify(sortedOptions);

            const existingIndex = prev.findIndex(i =>
                i.id === item.id &&
                JSON.stringify(i.selectedOptions || []) === optionsKey
            );

            if (existingIndex > -1) {
                const newCart = [...prev];
                newCart[existingIndex].quantity += quantity;
                return newCart;
            }

            return [...prev, {
                ...item,
                quantity,
                selectedOptions: sortedOptions,
                cartId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }];
        });
    }, []);

    const removeFromCart = useCallback((cartId) => {
        setCart(prev => prev.filter(i => i.cartId !== cartId));
    }, []);

    const updateQuantity = useCallback((cartId, delta) => {
        setCart(prev => {
            const newCart = [];
            let found = false;

            for (const item of prev) {
                if (item.cartId === cartId) {
                    found = true;
                    const newQty = item.quantity + delta;
                    if (newQty > 0) {
                        newCart.push({ ...item, quantity: newQty });
                    }
                    // If newQty <= 0, item is removed (not pushed)
                } else {
                    newCart.push(item);
                }
            }

            return found ? newCart : prev;
        });
    }, []);

    const clearCart = useCallback(() => setCart([]), []);

    const parsePrice = (val) => {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        let str = val.toString().trim();

        // Handle BOTH dot and comma (e.g. 25.000,00 or 25,000.00)
        if (str.includes('.') && str.includes(',')) {
            if (str.indexOf('.') < str.indexOf(',')) {
                // Indonesian format: 25.000,00 -> strip dot, replace comma with dot
                return parseFloat(str.replace(/\./g, '').replace(/,/g, '.'));
            } else {
                // US format: 25,000.00 -> strip comma
                return parseFloat(str.replace(/,/g, ''));
            }
        }

        // Handle ONLY comma (e.g. 25,000 - could be thousand or 25,00 - could be decimal)
        if (str.includes(',') && !str.includes('.')) {
            const parts = str.split(',');
            if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                // Thousand separator if 3 digits follow
                return parseFloat(str.replace(/,/g, ''));
            }
            // Otherwise treat as decimal
            return parseFloat(str.replace(/,/g, '.'));
        }

        // Handle ONLY dot (e.g. 25.000 - could be thousand or 25.00 - could be decimal)
        if (str.includes('.') && !str.includes(',')) {
            const parts = str.split('.');
            if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                // Thousand separator
                return parseFloat(str.replace(/\./g, ''));
            }
            // Otherwise treat as decimal (default parseFloat behavior)
        }

        return parseFloat(str.replace(/[^\d.-]/g, '')) || 0;
    };

    const cartTotal = cart.reduce((acc, item) => {
        const cleanPrice = parsePrice(item.price);
        const optionsTotal = (item.selectedOptions || []).reduce((sum, opt) => {
            return sum + (parsePrice(opt.price_adjustment) || 0);
        }, 0);

        const priceAfterDiscount = item.discount > 0 ? Math.round(cleanPrice * (1 - (item.discount / 100))) : cleanPrice;
        return acc + ((priceAfterDiscount + optionsTotal) * item.quantity);
    }, 0);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Get total quantity for a menu item ID (across all variants)
    const getItemQuantity = useCallback((itemId) => {
        return cart.filter(i => i.id === itemId).reduce((acc, i) => acc + i.quantity, 0);
    }, [cart]);

    // Get quantity for a specific variant
    const getVariantQuantity = useCallback((itemId, selectedOptions = []) => {
        const optionsKey = JSON.stringify([...selectedOptions].sort((a, b) => a.id - b.id));
        const item = cart.find(i =>
            i.id === itemId &&
            JSON.stringify(i.selectedOptions || []) === optionsKey
        );
        return item ? item.quantity : 0;
    }, [cart]);

    const getCartId = useCallback((itemId, selectedOptions = []) => {
        const optionsKey = JSON.stringify([...selectedOptions].sort((a, b) => a.id - b.id));
        const item = cart.find(i =>
            i.id === itemId &&
            JSON.stringify(i.selectedOptions || []) === optionsKey
        );
        return item ? item.cartId : null;
    }, [cart]);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartTotal,
            cartCount,
            getItemQuantity,
            getVariantQuantity,
            getCartId,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );
};
