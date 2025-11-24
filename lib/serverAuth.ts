import { getServerSession } from 'next-auth/next';
import { authOptions } from './nextAuth';
import { cookies } from 'next/headers';
import { verifyToken } from './jwt';

// Returns an object similar to NextAuth session ({ user: { id, role, tenantId, email } })
export async function getServerAuth() {
  // Prefer NextAuth server session
  try {
    const session: any = await getServerSession(authOptions as any);
    if (session && session.user) return session;
  } catch (e) {
    // ignore and fallback
  }

  // Fallback: check for legacy JWT cookie `pam_token` or Authorization header
  try {
    const cookieStore = cookies();
    const pam = cookieStore.get('pam_token')?.value;
    if (pam) {
      const payload: any = verifyToken(decodeURIComponent(pam));
      if (payload) {
        return { user: { id: payload.id || payload.userId || payload.sub, role: payload.role, tenantId: payload.tenantId, email: payload.email } };
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export default getServerAuth;
