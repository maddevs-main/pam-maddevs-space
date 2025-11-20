import type { NextApiRequest, NextApiResponse } from "next";

// Deprecated supabase proxy. Use /api/auth/local-login instead.
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(404).json({ error: 'not_found', message: 'Use /api/auth/local-login' });
}
