'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  color?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Загружаем корзину с сервера при инициализации
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch('/api/cart');
        if (response.ok) {
          const data = await response.json();
          setItems(data.items.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            name: item.product.name,
            price: item.priceAtAddition,
            image: item.product.images[0]?.url || '',
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          })));
        }
      } catch (error) {
        console.error('Ошибка при загрузке корзины:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchCart();
  }, []);

  const addToCart = async (item: Omit<CartItem, 'id' | 'quantity'>) => {
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: 1,
          size: item.size,
          color: item.color,
        }),
      });

      if (!response.ok) {
        throw new Error('Не удалось добавить товар в корзину');
      }

      const data = await response.json();
      
      setItems(prevItems => {
        const existingItem = prevItems.find(i => 
          i.productId === item.productId && 
          i.size === item.size && 
          i.color === item.color
        );
        
        if (existingItem) {
          return prevItems.map(i =>
            i.id === existingItem.id 
              ? { ...i, quantity: i.quantity + 1 } 
              : i
          );
        }
        
        return [...prevItems, { ...item, id: data.id, quantity: 1 }];
      });
    } catch (error) {
      console.error('Ошибка при добавлении в корзину:', error);
      throw error;
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      const response = await fetch(`/api/cart/items/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Не удалось удалить товар из корзины');
      }

      setItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Ошибка при удалении из корзины:', error);
      throw error;
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(id);
      return;
    }

    try {
      const response = await fetch(`/api/cart/items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });

      if (!response.ok) {
        throw new Error('Не удалось обновить количество товара');
      }

      setItems(prevItems =>
        prevItems.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Ошибка при обновлении количества:', error);
      throw error;
    }
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
