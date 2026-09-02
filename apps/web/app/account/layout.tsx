import { requireCustomer } from '@/lib/auth/middleware';
import { MainLayout } from '@/components/MainLayout';

// All /account/* pages require a logged-in customer.
// requireCustomer() redirects to /login if the customer-token cookie is missing or invalid.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  await requireCustomer();

  return <MainLayout>{children}</MainLayout>;
}
