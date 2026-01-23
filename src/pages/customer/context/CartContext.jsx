import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const saved = localStorage.getItem('customer_cart');
            const parsed = saved ? JSON.parse(saved) : [];
            // Migration: Ensure all items have cartId
            return parsed.map(item => {
                if (!item.cartId) {
                    return {
                        ...item,
                        cartId: `${item.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        selectedOptions: item.selectedOptions || []
                    };
                }
                return item;
            });
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('customer_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity = 1, selectedOptions = []) => {
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
    };

    const removeFromCart = (cartId) => {
        setCart(prev => prev.filter(i => i.cartId !== cartId));
    };

    const updateQuantity = (cartId, delta) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.cartId === cartId) {
                    const newQty = Math.max(0, item.quantity + delta);
                    return { ...item, quantity: newQty };
                }
                return item;
            }).filter(i => i.quantity > 0);
        });
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((acc, item) => {
        const optionsTotal = (item.selectedOptions || []).reduce((sum, opt) => sum + (parseFloat(opt.price_adjustment) || 0), 0);
        const priceAfterDiscount = item.discount > 0 ? parseFloat(item.price) * (1 - (item.discount / 100)) : parseFloat(item.price);
        return acc + ((priceAfterDiscount + optionsTotal) * item.quantity);
    }, 0);

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Get total quantity for a menu item ID (across all variants)
    const getItemQuantity = (itemId) => {
        return cart.filter(i => i.id === itemId).reduce((acc, i) => acc + i.quantity, 0);
    };

    // Get quantity for a specific variant
    const getVariantQuantity = (itemId, selectedOptions = []) => {
        const optionsKey = JSON.stringify([...selectedOptions].sort((a, b) => a.id - b.id));
        const item = cart.find(i =>
            i.id === itemId &&
            JSON.stringify(i.selectedOptions || []) === optionsKey
        );
        return item ? item.quantity : 0;
    };

    const getCartId = (itemId, selectedOptions = []) => {
        const optionsKey = JSON.stringify([...selectedOptions].sort((a, b) => a.id - b.id));
        const item = cart.find(i =>
            i.id === itemId &&
            JSON.stringify(i.selectedOptions || []) === optionsKey
        );
        return item ? item.cartId : null;
    };

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
            getCartId
        }}>
            {children}
        </CartContext.Provider>
    );
};
