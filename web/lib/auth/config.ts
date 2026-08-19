import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { AdminRole, getPermissionsForRole, isPublicRole, isAdminRole } from './types';
import { prisma } from '@/lib/prisma';

/**
 * Web Portal (public site) NextAuth configuration
 *
 * Allows:
 *   - CUSTOMER role → /login for account portal (/account)
 *   - DEALER role   → /login for dealer portal
 *   - ADMIN roles   → Redirected to /admin/login (the admin panel on port 3001)
 *
 * Admin panel auth lives in the ADMIN app (port 3001), not here.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          });

          if (!user || !user.isActive) {
            return null;
          }

          // Admin staff: redirect them to use the admin panel on port 3001 instead
          if (isAdminRole(user.role)) {
            return null;
          }

          // Only CUSTOMER and DEALER roles are allowed on this (web) portal
          if (!isPublicRole(user.role)) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) {
            return null;
          }

          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as AdminRole,
            dealerId: user.dealerId ?? undefined,
          };
        } catch (error) {
          console.error('Web portal authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.dealerId = user.dealerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as AdminRole;
        session.user.dealerId = token.dealerId as string | undefined;
        session.user.permissions = getPermissionsForRole(token.role as AdminRole);
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days for customer portal
  },
  secret: process.env.NEXTAUTH_SECRET,
};
