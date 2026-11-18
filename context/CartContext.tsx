
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { CartItem, Meal } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (meal: Meal, quantity?: number, selectedSpiceLevel?: string, selectedPortionSize?: string) => void;
  removeFromCart: (mealId: string) => void;
  updateQuantity: (mealId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  lastAddedItemId: string | null; // For UI feedback
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);

  useEffect(() => {
    const storedCart = localStorage.getItem('momVyanjanCart');
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('momVyanjanCart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (meal: Meal, quantity: number = 1, selectedSpiceLevel?: string, selectedPortionSize?: string) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === meal.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === meal.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prevItems, { ...meal, quantity, selectedSpiceLevel: selectedSpiceLevel as CartItem['selectedSpiceLevel'], selectedPortionSize: selectedPortionSize as CartItem['selectedPortionSize'] }];
    });
    setLastAddedItemId(meal.id);
    setTimeout(() => {
      setLastAddedItemId(null);
    }, 2000); // UI feedback lasts for 2 seconds
  };

  const removeFromCart = (mealId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== mealId));
  };

  const updateQuantity = (mealId: string, quantity: number) => {
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === mealId ? { ...item, quantity: Math.max(0, quantity) } : item
      ).filter(item => item.quantity > 0) // Remove if quantity is 0
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, lastAddedItemId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};