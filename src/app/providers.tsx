"use client";

import { Session } from "next-auth";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { CartProvider } from "@/contexts/CartContext";

// Тип сессии уже определен в src/types/next-auth.d.ts
// Используем его вместо дублирования
interface CustomSession extends Session {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: 'ADMIN' | 'SELLER' | 'BUYER';
  };
  accessToken: string;
  expires: string;
}

export function Providers({
  children,
  session,
}: {
  children: React.ReactNode;
  session: CustomSession | null;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      <CartProvider>
        {children}
      </CartProvider>
    </NextAuthSessionProvider>
  );
}
