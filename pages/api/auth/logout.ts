import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  // Deprecated: use NextAuth client `signOut()` which will POST to /api/auth/signout.
  res.status(410).json({ error: 'deprecated', message: 'Use NextAuth signOut (client: signOut from next-auth/react).' });
}
