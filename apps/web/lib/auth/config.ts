import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize() {
        return null;
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);
