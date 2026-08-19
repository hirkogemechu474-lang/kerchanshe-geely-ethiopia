import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Export the handler directly — do NOT wrap it.
// NextAuth v4 handles the Next.js App Router route params internally.
// Any wrapper that awaits params or inspects the request before passing to
// NextAuth breaks the internal state machine and causes login to hang.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
