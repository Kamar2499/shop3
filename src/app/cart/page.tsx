'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';

export default function CartPage() {
  const router = useRouter();
  const { 
    items: cartItems, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    totalItems, 
    totalPrice 
  } = useCart();
  
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      // Здесь будет логика оформления заказа
      console.log('Оформление заказа:', cartItems);
      // Перенаправляем на страницу оформления заказа
      router.push('/checkout');
    } catch (error) {
      console.error('Ошибка при оформлении заказа:', error);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      setIsUpdating(prev => ({ ...prev, [itemId]: true }));
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      console.error('Ошибка при обновлении количества:', error);
    } finally {
      setIsUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };
  
  const handleRemoveItem = async (itemId: string) => {
    try {
      setIsUpdating(prev => ({ ...prev, [itemId]: true }));
      await removeFromCart(itemId);
    } catch (error) {
      console.error('Ошибка при удалении товара:', error);
    } finally {
      setIsUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Ваша корзина</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Список товаров */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ваша корзина пуста</h3>
              <p className="text-gray-500 mb-4">Начните добавлять товары в корзину</p>
              <Link href="/catalog">
                <Button>В каталог товаров</Button>
              </Link>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row border rounded-lg p-4">
                {/* Изображение товара */}
                <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden mb-4 sm:mb-0 sm:mr-6">
                  <Image
                    src={item.image || '/placeholder-product.jpg'}
                    alt={item.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Информация о товаре */}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <h2 className="text-lg font-medium">{item.name}</h2>
                      {item.size && (
                        <p className="text-sm text-gray-600 mt-1">
                          Размер: <span className="font-medium">{item.size}</span>
                        </p>
                      )}
                      {item.color && (
                        <p className="text-sm text-gray-600">
                          Цвет: <span className="font-medium">{item.color}</span>
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating[item.id]}
                      className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      aria-label="Удалить из корзины"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center border rounded-md overflow-hidden">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating[item.id] || item.quantity <= 1}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Уменьшить количество"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="px-4 py-1 w-12 text-center">
                        {isUpdating[item.id] ? '...' : item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating[item.id]}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                        aria-label="Увеличить количество"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <div className="text-lg font-medium">
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0
                      }).format(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Итого */}
        {cartItems.length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-medium mb-4">Итого</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Товары ({totalItems})</span>
                  <span>
                    {new Intl.NumberFormat('ru-RU', {
                      style: 'currency',
                      currency: 'RUB',
                      maximumFractionDigits: 0
                    }).format(
                      cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
                    )}
                  </span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Итого</span>
                    <span>
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0
                      }).format(totalPrice)}
                    </span>
                  </div>
                </div>
                <Button 
                  onClick={handleCheckout} 
                  disabled={isCheckingOut}
                  className="w-full mt-6"
                >
                  {isCheckingOut ? 'Оформляем...' : 'Оформить заказ'}
                </Button>
                <div className="text-sm text-gray-500 mt-4">
                  <p>Бесплатная доставка от 5000 ₽</p>
                  <p>Возврат в течение 14 дней</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
