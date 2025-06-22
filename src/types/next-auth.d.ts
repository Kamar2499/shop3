import 'next-auth';
import { UserRole } from '@/types/db';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role: UserRole;
      image?: string | null;
    };
    accessToken: string;
    expires: string;
  }

  interface User {
    id: string;
    email?: string | null;
    name?: string | null;
    role: UserRole;
    image?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    accessToken: string;
  }
}
