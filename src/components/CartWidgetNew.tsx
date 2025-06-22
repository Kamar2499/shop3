'use client';

import { X, Plus, Minus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import type { CartItem } from '@/contexts/CartContext';

interface CartWidgetProps {
  onClose: () => void;
}

export default function CartWidgetNew({ onClose }: CartWidgetProps) {
  const { 
    items: cartItems, 
    updateQuantity, 
    removeFromCart,
    totalItems,
    totalPrice 
  } = useCart();

  const handleUpdateQuantity = (item: CartItem, delta: number) => {
    const newQuantity = item.quantity + delta;
    if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity);
    } else {
      removeFromCart(item.id);
    }
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        />
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="w-screen max-w-md">
            <div className="flex h-full flex-col bg-white shadow-xl">
              <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Корзина</h2>
                  <button
                    type="button"
                    className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="mt-8">
                  <div className="flow-root">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">Ваша корзина пуста</p>
                        <div className="mt-6">
                          <button
                            type="button"
                            onClick={onClose}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Продолжить покупки
                          </button>
                        </div>
                      </div>
                    ) : (
                      <ul className="-my-6 divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <li key={item.id} className="flex py-6">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover object-center"
                              />
                            </div>

                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>{item.name}</h3>
                                  <p className="ml-4">
                                    {new Intl.NumberFormat('ru-RU', {
                                      style: 'currency',
                                      currency: 'RUB',
                                      maximumFractionDigits: 0,
                                    }).format(item.price * item.quantity)}
                                  </p>
                                </div>
                                {item.size && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    Размер: {item.size}
                                  </p>
                                )}
                                {item.color && (
                                  <p className="mt-1 text-sm text-gray-500">
                                    Цвет: {item.color}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-1 items-end justify-between text-sm">
                                <div className="flex items-center border rounded-md">
                                  <button
                                    onClick={() => handleUpdateQuantity(item, -1)}
                                    className="px-2 py-1 hover:bg-gray-100"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-2">{item.quantity}</span>
                                  <button
                                    onClick={() => handleUpdateQuantity(item, 1)}
                                    className="px-2 py-1 hover:bg-gray-100"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="font-medium text-red-600 hover:text-red-500"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Итого</p>
                    <p>
                      {new Intl.NumberFormat('ru-RU', {
                        style: 'currency',
                        currency: 'RUB',
                        maximumFractionDigits: 0,
                      }).format(totalPrice)}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    Доставка и налоги рассчитываются при оформлении заказа
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/checkout"
                      className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                    >
                      Оформить заказ
                    </Link>
                  </div>
                  <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                    <p>
                      или{' '}
                      <button
                        type="button"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        onClick={onClose}
                      >
                        Продолжить покупки
                        <span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}