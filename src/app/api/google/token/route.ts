import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { mintAccessToken } from "@/lib/drive-account";

export const runtime = "nodejs";

const MESSAGES: Record<string, string> = {
  "not-configured": "Google Drive is not configured on this server.",
  "not-connected": "You have not connected a Google account yet.",
  expired: "Your Google sign-in expired. Please reconnect Drive.",
};

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const result = await mintAccessToken(user.id);
  if ("error" in result) {
    return NextResponse.json(
      { error: MESSAGES[result.error] ?? "Google Drive is not available.", reason: result.error },
      { status: 409 },
    );
  }

  return NextResponse.json({
    accessToken: result.accessToken,
    folderId: result.folderId,
    email: result.email,
  });
}
