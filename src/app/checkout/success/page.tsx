'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function CheckoutSuccess() {
  // Clear any cart-related data from localStorage
  useEffect(() => {
    // This ensures the cart is cleared when the success page is loaded
    // The actual cart is already cleared when the order is submitted
    return () => {
      // Additional cleanup if needed
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 p-4 rounded-full">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Спасибо за заказ!</h1>
        <p className="text-lg text-gray-600 mb-8">
          Ваш заказ успешно оформлен. В ближайшее время с вами свяжется наш менеджер для подтверждения заказа.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/catalog">
            <Button variant="outline" className="w-full sm:w-auto">
              Вернуться в каталог
            </Button>
          </Link>
          <Link href="/profile/orders">
            <Button className="w-full sm:w-auto">
              Мои заказы
            </Button>
          </Link>
        </div>
        
        <div className="mt-12 p-6 bg-gray-50 rounded-lg text-left">
          <h2 className="text-xl font-semibold mb-4">Что дальше?</h2>
          <ul className="space-y-3 text-gray-600">
            <li className="flex items-start">
              <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Мы отправили вам письмо с деталями заказа на указанный email</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Наш менеджер свяжется с вами для подтверждения заказа</span>
            </li>
            <li className="flex items-start">
              <span className="inline-block bg-blue-100 text-blue-600 rounded-full p-1 mr-3 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
              <span>Отслеживать статус заказа вы можете в личном кабинете</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
