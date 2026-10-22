import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { driveConfigured, encryptToken, exchangeCode, fetchGoogleEmail } from "@/lib/drive";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const done = (status: string) => NextResponse.redirect(`${origin}/profile?drive=${status}`);

  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!driveConfigured()) return done("not-configured");
  if (url.searchParams.get("error")) return done("denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expected = jar.get("bsp_oauth_state")?.value;
  if (!code || !state || !expected || state !== expected) return done("error");

  try {
    const tokens = await exchangeCode(code);
    const email = await fetchGoogleEmail(tokens.access_token);
    await db
      .update(users)
      .set({
        googleEmail: email,
        googleConnectedAt: new Date(),
        ...(tokens.refresh_token ? { googleRefreshToken: encryptToken(tokens.refresh_token) } : {}),
      })
      .where(eq(users.id, user.id));
  } catch {
    return done("error");
  }

  const response = done("connected");
  response.cookies.set("bsp_oauth_state", "", { path: "/", maxAge: 0 });
  return response;
}
