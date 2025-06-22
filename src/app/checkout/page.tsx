'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type DeliveryMethod = 'courier' | 'pickup';
type PaymentMethod = 'card' | 'cash';

export default function CheckoutPage() {
  const router = useRouter();
  const { items: cartItems, totalPrice, clearCart } = useCart();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    comment: '',
    deliveryMethod: 'courier' as DeliveryMethod,
    paymentMethod: 'card' as PaymentMethod,
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cartItems.length === 0) {
      setError('Ваша корзина пуста');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Here you would typically send the order to your backend
      console.log('Submitting order:', { ...formData, items: cartItems, totalPrice });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear cart and redirect to success page
      clearCart();
      router.push('/checkout/success');
      
    } catch (err) {
      console.error('Ошибка при оформлении заказа:', err);
      setError('Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Ваша корзина пуста</h1>
        <p className="mb-6">Прежде чем оформить заказ, добавьте товары в корзину</p>
        <Button onClick={() => router.push('/catalog')}>Вернуться в каталог</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Delivery and payment info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Contact information */}
          <Card>
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input 
                    id="firstName" 
                    name="firstName" 
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input 
                    id="lastName" 
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  value={formData.email}
                  onChange={handleInputChange}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Телефон *</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  value={formData.phone}
                  onChange={handleInputChange}
                  required 
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Delivery method */}
          <Card>
            <CardHeader>
              <CardTitle>Способ доставки</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.deliveryMethod} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, deliveryMethod: value as DeliveryMethod }))}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="courier" id="delivery-courier" />
                  <Label htmlFor="delivery-courier">Курьерская доставка</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="delivery-pickup" />
                  <Label htmlFor="delivery-pickup">Самовывоз из магазина</Label>
                </div>
              </RadioGroup>
              
              {formData.deliveryMethod === 'courier' && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="address">Адрес доставки *</Label>
                  <Input 
                    id="address" 
                    name="address" 
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Payment method */}
          <Card>
            <CardHeader>
              <CardTitle>Способ оплаты</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value as PaymentMethod }))}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="payment-card" />
                  <Label htmlFor="payment-card">Банковской картой</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="payment-cash" />
                  <Label htmlFor="payment-cash">Наличными при получении</Label>
                </div>
              </RadioGroup>
              
              {formData.paymentMethod === 'card' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">Оплата банковской картой будет доступна на следующем шаге</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Comment */}
          <Card>
            <CardHeader>
              <CardTitle>Комментарий к заказу</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="comment">Дополнительная информация (необязательно)</Label>
                <textarea
                  id="comment"
                  name="comment"
                  rows={4}
                  value={formData.comment}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Например, особые условия доставки"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Order summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Ваш заказ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Количество: {item.quantity}</p>
                    </div>
                    <p className="font-medium">{item.price * item.quantity} ₽</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Товары ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>{totalPrice} ₽</span>
                </div>
                {formData.deliveryMethod === 'courier' && (
                  <div className="flex justify-between">
                    <span>Доставка</span>
                    <span>Бесплатно</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                  <span>Итого</span>
                  <span>{totalPrice} ₽</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  className="w-full py-6 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Оформляем заказ...' : 'Подтвердить заказ'}
                </Button>
                
                {error && (
                  <p className="mt-4 text-sm text-red-600">{error}</p>
                )}
                
                <p className="mt-4 text-xs text-gray-500">
                  Нажимая на кнопку, вы соглашаетесь с условиями оферты и политикой конфиденциальности
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
