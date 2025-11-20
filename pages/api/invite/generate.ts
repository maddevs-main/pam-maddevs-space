import type { NextApiRequest, NextApiResponse } from "next";
import { createInvite } from "../../../lib/invite";
import { requireAuth } from "../../../lib/auth";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const auth: any = (req as any).auth;
  if (!auth || auth.role !== 'admin') return res.status(403).json({ error: 'forbidden' });

  const { role, tenantId, expiresInHours } = req.body || {};
  try {
    // default tenantId to admin's tenant if not provided
    const invite = await createInvite({ role: role || 'consumer', tenantId: tenantId || auth.tenantId, expiresInHours });
    res.json({ ok: true, invite });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export default requireAuth(handler, ['admin']);
