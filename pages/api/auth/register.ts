import type { NextApiRequest, NextApiResponse } from "next";
import { validateInvite, markInviteUsed } from "../../../lib/invite";
import connectToDatabase from "../../../lib/mongodb";
import bcrypt from "bcrypt";
import { signToken } from "../../../lib/jwt";

// Local register flow (no Supabase):
// 1. Validate invite code
// 2. Hash password and create user document in MongoDB with role/tenant mapping
// 3. Mark invite used

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { inviteCode, email, password, name, organisation, bio, profilePic } = req.body || {};
  if (!inviteCode || !email || !password) return res.status(400).json({ error: "missing_fields" });

  const v = await validateInvite(inviteCode);
  if (!v.valid) return res.status(400).json({ error: "invalid_invite", reason: v.reason });

  try {
    const { db } = await connectToDatabase();

    // ensure email not already used
    const existing = await db.collection("users").findOne({ email });
    if (existing) return res.status(400).json({ error: 'email_in_use' });

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const invite = (v as any).invite;
    const seed = (name && String(name).trim()) || email || String(new Date().getTime());
    const defaultAvatar = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`;
    const userDoc: any = {
      email,
      name: name || "",
      passwordHash,
      role: invite.role,
      tenantId: invite.tenantId || null,
      organisation: organisation || '',
      bio: bio || '',
      profilePic: profilePic || defaultAvatar,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(userDoc);

    // mark invite used with the created user id
    await markInviteUsed(inviteCode, result.insertedId.toString());

    const payload = { id: result.insertedId.toString(), email: userDoc.email, role: userDoc.role, name: userDoc.name, tenantId: userDoc.tenantId || null };
    const token = signToken(payload);
    res.json({ ok: true, token, user: payload });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || String(err) });
  }
}
