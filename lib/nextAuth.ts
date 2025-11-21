import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import connectToDatabase from './mongodb';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        // Small diagnostics to help debug signin issues in development.
        const debug = process.env.NEXTAUTH_DEBUG || process.env.NODE_ENV === 'development';
        if (debug) console.log('[NextAuth] authorize called for', credentials.email);
        const { db } = await connectToDatabase();
        if (debug) console.log('[NextAuth] connected DB name:', (db && db.databaseName));
        const user = await db.collection('users').findOne({ email: credentials.email });
        if (debug) console.log('[NextAuth] user found:', !!user, user && user.email);
        if (!user) return null;
        const ok = await compare(credentials.password || '', user.passwordHash || '');
        if (debug) console.log('[NextAuth] password compare result for', credentials.email, ':', ok);
        if (!ok) return null;
        return { id: user._id.toString(), email: user.email, name: user.name, role: user.role, tenantId: user.tenantId };
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 6 * 24 * 60 * 60, // 6 days
    updateAge: 24 * 60 * 60,  // Refresh session every 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        domain: process.env.NODE_ENV === 'production'
          ? process.env.NEXTAUTH_COOKIE_DOMAIN
          : undefined,
      },
    },
  },
  jwt: { /* use default */ },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'dev_nextauth_secret',
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, copy user properties to the token.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // Copy properties from token to session.
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
        session.user.name = token.name;
        session.user.email = token.email;
      }
      return session;
    }
  }
};

export default NextAuth(authOptions as any);
