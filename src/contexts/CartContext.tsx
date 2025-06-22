'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';

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
  const { data: session } = useSession() as { data: (Session & { accessToken?: string }) | null };
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Функция для выполнения авторизованных запросов
  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    console.log('fetchWithAuth called with url:', url);
    
    if (!session) {
      console.error('Сессия не найдена');
      window.location.href = '/login';
      throw new Error('Требуется авторизация');
    }
    
    const token = session.accessToken;
    console.log('Current session token:', token ? `[TOKEN_PRESENT, length: ${token.length}]` : 'MISSING');
    
    if (!token) {
      console.error('Токен доступа не найден в сессии');
      window.location.href = '/login';
      throw new Error('Требуется авторизация');
    }
    
    // Создаем новый объект headers, чтобы избежать мутаций
    const headers = new Headers();
    
    // Устанавливаем Content-Type по умолчанию для JSON
    const hasContentType = options.headers && 
      ((options.headers instanceof Headers && options.headers.has('Content-Type')) ||
       (Array.isArray(options.headers) && options.headers.some(([key]) => key.toLowerCase() === 'content-type')) ||
       (typeof options.headers === 'object' && 'Content-Type' in options.headers));
      
    if (!hasContentType && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Добавляем авторизационный токен
    headers.set('Authorization', `Bearer ${token}`);
    
    // Добавляем переданные заголовки
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers.set(key, value);
        });
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          if (value) headers.set(key, value);
        });
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value) headers.set(key, String(value));
        });
      }
    }
    
    // Устанавливаем Content-Type по умолчанию, если не установлен
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }
    
    // Добавляем токен авторизации
    headers.set('Authorization', `Bearer ${token}`);
    
    console.log('Sending request to:', url, {
      method: options.method || 'GET',
      headers: Object.fromEntries(headers.entries()),
      hasBody: !!options.body
    });

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Handle unauthorized (e.g., redirect to login)
      console.error('Ошибка авторизации');
      throw new Error('Требуется авторизация');
    }

    return response;
  }, [session]);

  // Загружаем корзину с сервера при инициализации и при изменении сессии
  useEffect(() => {
    const fetchCart = async () => {
      if (!session) {
        setItems([]);
        setIsLoaded(true);
        return;
      }

      try {
        const response = await fetchWithAuth('/api/cart');
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
  }, [session, fetchWithAuth]);

  const addToCart = async (item: Omit<CartItem, 'id' | 'quantity'>) => {
    if (!session) {
      // Если пользователь не авторизован, перенаправляем на страницу входа
      window.location.href = '/login';
      return;
    }

    try {
      const response = await fetchWithAuth('/api/cart', {
        method: 'POST',
        body: JSON.stringify({
          productId: item.productId,
          quantity: 1,
          size: item.size,
          color: item.color,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Не удалось добавить товар в корзину');
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
