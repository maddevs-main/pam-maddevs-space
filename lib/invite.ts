import connectToDatabase from "./mongodb";
import { randomBytes } from "crypto";

export async function createInvite(options: { role: string; tenantId?: string; expiresInHours?: number }) {
  const { db } = await connectToDatabase();
  const code = randomBytes(6).toString("hex");
  const now = new Date();
  const doc = {
    code,
    role: options.role || "consumer",
    tenantId: options.tenantId || null,
    createdAt: now,
    expiresAt: options.expiresInHours ? new Date(now.getTime() + options.expiresInHours * 3600 * 1000) : null,
    used: false,
    usedBy: null,
  };
  await db.collection("invites").insertOne(doc);
  return doc;
}

export async function validateInvite(code: string) {
  const { db } = await connectToDatabase();
  const invite = await db.collection("invites").findOne({ code });
  if (!invite) return { valid: false, reason: "not_found" };
  if (invite.used) return { valid: false, reason: "used" };
  if (invite.expiresAt && invite.expiresAt < new Date()) return { valid: false, reason: "expired" };
  return { valid: true, invite };
}

export async function markInviteUsed(code: string, userId: string) {
  const { db } = await connectToDatabase();
  await db.collection("invites").updateOne({ code }, { $set: { used: true, usedBy: userId, usedAt: new Date() } });
}
