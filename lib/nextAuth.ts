import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcrypt';
import connectToDatabase from './mongodb';

// Runtime checks: warn in production when critical env vars for cookie auth are missing.
if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXTAUTH_URL) {
    console.warn('[Startup] WARNING: NEXTAUTH_URL is not set. NextAuth cookies and redirects may not behave correctly in production.');
  }
  if (!process.env.COOKIE_DOMAIN) {
    console.warn('[Startup] WARNING: COOKIE_DOMAIN is not set. Cross-subdomain cookies may not be set correctly without a custom domain (required on Vercel).');
  }
}

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
    // Increase session lifetime for a better persistent-login UX
    // without requiring the user to re-login frequently.
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60,  // Refresh session every 24 hours
  },
  cookies: {
    sessionToken: {
      // Use secure-prefixed cookie names only in production. On localhost
      // browsers may reject cookies named with `__Secure-` if the Secure
      // flag is not present. Allow override with NEXTAUTH_COOKIE_NAME.
      name: process.env.NEXTAUTH_COOKIE_NAME || (process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token'),
      options: {
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        domain: (process.env.COOKIE_DOMAIN && !process.env.COOKIE_DOMAIN.includes('localhost')) ? process.env.COOKIE_DOMAIN : undefined,
      }
    }
  },
  jwt: { /* use default */ },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'dev_nextauth_secret',
  callbacks: {
    async jwt({ token, user }) {
      // Always sync user fields on sign in or token refresh
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
        token.email = (user as any).email;
        token.name = (user as any).name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).userId;
        (session.user as any).role = (token as any).role;
        (session.user as any).tenantId = (token as any).tenantId;
        (session.user as any).email = (token as any).email;
        (session.user as any).name = (token as any).name;
      }
      return session;
    }
  }
};

export default NextAuth(authOptions as any);
