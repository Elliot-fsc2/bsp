import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { decryptToken, driveConfigured, ensureFolder, refreshAccessToken } from "./drive";

export async function getDriveAccount(userId: number) {
  const row = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!row) return null;
  return {
    email: row.googleEmail,
    folderId: row.googleFolderId,
    refreshToken: row.googleRefreshToken ? decryptToken(row.googleRefreshToken) : null,
  };
}

export type DriveTokenResult =
  | { error: "not-configured" | "not-connected" | "expired" }
  | { accessToken: string; folderId: string | null; email: string | null };

export async function mintAccessToken(userId: number): Promise<DriveTokenResult> {
  if (!driveConfigured()) return { error: "not-configured" };
  const account = await getDriveAccount(userId);
  if (!account?.refreshToken) return { error: "not-connected" };

  const accessToken = await refreshAccessToken(account.refreshToken);
  if (!accessToken) return { error: "expired" };

  const folderId = await ensureFolder(accessToken, account.folderId ?? null);
  if (folderId && folderId !== account.folderId) {
    await db.update(users).set({ googleFolderId: folderId }).where(eq(users.id, userId));
  }
  return { accessToken, folderId, email: account.email };
}

export async function reviewerEmails(excludeEmail?: string | null) {
  const rows = await db
    .select({ email: users.googleEmail })
    .from(users)
    .where(inArray(users.role, ["teacher", "admin"]));
  const emails = rows
    .map((row) => row.email)
    .filter((email): email is string => Boolean(email) && email !== excludeEmail);
  return [...new Set(emails)];
}
