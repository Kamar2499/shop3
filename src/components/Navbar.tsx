'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Session } from 'next-auth';
import { User, LogOut, ShoppingCart, Store, LayoutDashboard } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useState } from 'react';
import CartWidgetNew from './CartWidgetNew';

interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: 'ADMIN' | 'SELLER' | 'BUYER';
  };
}

export default function Navbar() {
  const { data: session } = useSession() as { data: CustomSession | null };
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { items: cartItems, totalItems } = useCart();

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Магазин одежды
              </span>
            </Link>

            <div className="hidden md:flex space-x-8">
              <Link href="/catalog" className="text-gray-800 hover:text-gray-900 transition-colors">
                Каталог
              </Link>
              <Link href="/about" className="text-gray-800 hover:text-gray-900 transition-colors">
                О нас
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button 
              onClick={toggleCart} 
              className="p-2 rounded-full hover:bg-gray-100 relative"
              aria-label="Корзина"
            >
              <ShoppingCart className="h-5 w-5 text-gray-800" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {session ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium cursor-pointer p-0 !important leading-none"
                    >
                      {session.user.name ? session.user.name.charAt(0).toUpperCase() :
                       session.user.email ? session.user.email.charAt(0).toUpperCase() : 'U'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white !important shadow-lg" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user.name || 'Пользователь'}
                        </p>
                        <p className="text-xs leading-none text-gray-900">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/profile">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Профиль</span>
                      </DropdownMenuItem>
                    </Link>

                    {session.user.role === 'ADMIN' && (
                      <Link href="/admin">
                        <DropdownMenuItem className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <span>Админ панель</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    {session.user.role === 'SELLER' && (
                      <Link href="/seller">
                        <DropdownMenuItem className="cursor-pointer">
                          <Store className="mr-2 h-4 w-4" />
                          <span>Панель продавца</span>
                        </DropdownMenuItem>
                      </Link>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Выйти</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Войти</Button>
                </Link>
                <Link href="/register">
                  <Button>Регистрация</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      {isCartOpen && <CartWidgetNew onClose={() => setIsCartOpen(false)} />}
    </nav>
  );
}