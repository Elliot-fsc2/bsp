import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { driveAuthorizeUrl, driveConfigured } from "@/lib/drive";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/login`);
  if (!driveConfigured()) return NextResponse.redirect(`${origin}/profile?drive=not-configured`);

  const state = randomUUID();
  const response = NextResponse.redirect(driveAuthorizeUrl(state));
  response.cookies.set("bsp_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
