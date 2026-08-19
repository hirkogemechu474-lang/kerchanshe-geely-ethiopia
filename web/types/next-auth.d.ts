import 'next-auth';
import { AdminRole, AdminPermissions } from '@/lib/auth/types';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: AdminRole;
    dealerId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: AdminRole;
      dealerId?: string;
      permissions: AdminPermissions;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: AdminRole;
    dealerId?: string;
  }
}
