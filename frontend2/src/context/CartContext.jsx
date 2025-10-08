import React, { createContext, useState, useContext, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        try {
            const localCart = localStorage.getItem('cart');
            return localCart ? JSON.parse(localCart) : [];
        } catch (error) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (dish, quantityToAdd = 1) => {
        setCart(currentCart => {
            const existingItem = currentCart.find(item => item.id === dish.id);
            if (existingItem) {
                return currentCart.map(item =>
                    item.id === dish.id ? { ...item, quantity: item.quantity + quantityToAdd } : item
                );
            }
            return [...currentCart, { ...dish, quantity: quantityToAdd }];
        });
        toast.success(`${dish.name} added to cart!`);
    };
    const increaseQuantity = (dishId) => {
        setCart(currentCart => currentCart.map(item =>
            item.id === dishId ? { ...item, quantity: item.quantity + 1 } : item
        ));
    };
    const decreaseQuantity = (dishId) => {
        setCart(currentCart => {
            const itemInCart = currentCart.find(item => item.id === dishId);
            if (itemInCart?.quantity === 1) {
                // If quantity is 1, remove the item from the cart
                return currentCart.filter(item => item.id !== dishId);
            }
            // Otherwise, just decrease the quantity
            return currentCart.map(item =>
                item.id === dishId ? { ...item, quantity: item.quantity - 1 } : item
            );
        });
    };
    const value = { cart, setCart, addToCart };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};