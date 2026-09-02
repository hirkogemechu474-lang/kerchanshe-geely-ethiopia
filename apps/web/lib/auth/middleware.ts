import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { serverApiClient } from "@/lib/serverApiClient";

export interface CustomerSession {
  id: string;
  name: string;
  email: string;
  role?: string;
  phone?: string;
  image?: string;
}

export function withAuth(handler: any) {
  return handler;
}

export function getSession(): CustomerSession | null {
  return null;
}

export function requireAuth(): CustomerSession | null {
  return null;
}

// Reads the real customer identity from the backend using the visitor's own
// `customer-token` cookie (see backend/src/middleware/auth.ts
// requireCustomerSession + GET /api/auth/me). Returns null when logged out
// or the session is invalid/expired.
export async function getServerSession(): Promise<CustomerSession | null> {
  try {
    const cookieStore = await cookies();
    if (!cookieStore.get("customer-token")) return null;
    const client = await serverApiClient();
    const { data } = await client.get("/auth/me");
    return data;
  } catch {
    return null;
  }
}

export async function requireCustomer(): Promise<CustomerSession> {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return session;
}
