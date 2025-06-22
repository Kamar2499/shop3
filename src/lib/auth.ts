import NextAuth, { type Session, type User } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@/types/database';
import { findUserByEmail } from './repositories/user.repository';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User type is now defined in next-auth.d.ts

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      } as const,
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Требуется ввести email и пароль');
        }

        const user = await findUserByEmail(credentials.email);

        if (!user || !user.password) {
          throw new Error('Неверный email или пароль');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Неверный email или пароль');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        // Type assertion to include our custom fields
        token.role = user.role;
        token.id = user.id;
        // Generate a new JWT token for API authentication
        token.accessToken = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: user.role 
          },
          JWT_SECRET,
          { expiresIn: '1h' }
        );
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        // Add custom fields to session
        session.user.role = token.role;
        session.user.id = token.id;
        // Add access token to session
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: { id: string; email: string; role: UserRole }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; role: UserRole } {
  console.log('Verifying token...');
  console.log('Token length:', token.length);
  
  if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined');
    throw new Error('Ошибка конфигурации сервера');
  }
  
  if (!token || typeof token !== 'string') {
    console.error('Invalid token format:', token);
    throw new Error('Неверный формат токена');
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: UserRole };
    console.log('Token verified successfully for user:', decoded.email);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Срок действия токена истек');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Недействительный токен');
    } else {
      console.error('Unexpected error during token verification:', error);
      throw new Error('Ошибка проверки токена');
    }
  }
}