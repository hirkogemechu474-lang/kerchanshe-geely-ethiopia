import axios from "axios";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_API_URL || "http://localhost:4000";

// `apiClient` (lib/apiClient.ts) relies on the browser's own cookie jar via
// `withCredentials` — that doesn't exist during server-side rendering, since
// a Server Component's HTTP call to the backend is a plain server-to-server
// request with no ambient cookies. Forward the incoming request's own
// cookies explicitly so the backend's session middleware (customer-token /
// next-auth session cookie) sees the same session the browser has.
export async function serverApiClient() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  return axios.create({
    baseURL: `${API_BASE_URL}/api`,
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });
}

// For server-side fetches that only ever hit `/public/*` endpoints (no
// per-user data, so no session cookie to forward). Calling `cookies()` — as
// `serverApiClient()` above does — opts the *entire* route out of static
// rendering/ISR, which is what was forcing the homepage to fully
// server-render on every request despite its `export const revalidate = 60`.
// A plain client without that call lets those routes stay static.
export const publicApiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});
