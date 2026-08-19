import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { AdminRole, AdminPermissions, isAdminRole } from './types';
import { redirect } from 'next/navigation';
import { getCustomerSession } from './customer';

// ─── Admin auth (NextAuth JWT) ────────────────────────────────────────────────

// Cache getServerSession per request — only one DB hit per server render
// regardless of how many pages/layouts call requireAuth().
export const getSession = cache(async () => {
  return await getServerSession(authOptions);
});

export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/admin/login');
  }

  // Extra safety: if somehow a customer token slips through, reject it
  if (!isAdminRole(session.user.role)) {
    redirect('/admin/login');
  }

  return session;
}

export async function requireRole(allowedRoles: AdminRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    redirect('/admin/unauthorized');
  }

  return session;
}

export async function requirePermission(permission: keyof AdminPermissions) {
  const session = await requireAuth();

  if (!session.user.permissions[permission]) {
    redirect('/admin/unauthorized');
  }

  return session;
}

// ─── Customer auth (JWT cookie) ───────────────────────────────────────────────

// Use this in public-facing account pages (/account, /account/orders, etc.)
// Redirects to /login if the customer is not signed in.
export async function requireCustomer() {
  const customer = await getCustomerSession();

  if (!customer) {
    redirect('/login');
  }

  return customer;
}
