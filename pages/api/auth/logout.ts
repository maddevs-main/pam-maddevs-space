import type { NextApiRequest, NextApiResponse } from 'next';
import { clearLoginCookie } from '../../../lib/auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  clearLoginCookie(res);
  res.json({ ok: true });
}
