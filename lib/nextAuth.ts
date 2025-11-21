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
  session: { strategy: 'jwt' },
  jwt: { /* use default */ },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'dev_nextauth_secret',
  callbacks: {
    async jwt({ token, user }) {
      // On sign in, user will be present
      if (user) {
        token.userId = (user as any).id;
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).userId;
        (session.user as any).role = (token as any).role;
        (session.user as any).tenantId = (token as any).tenantId;
      }
      return session;
    }
  }
};

export default NextAuth(authOptions as any);
