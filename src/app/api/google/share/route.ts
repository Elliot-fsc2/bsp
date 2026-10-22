import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fileMetadata, shareFileWithReviewers } from "@/lib/drive";
import { mintAccessToken, reviewerEmails } from "@/lib/drive-account";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "You must be signed in." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { fileId?: string };
  const fileId = typeof body.fileId === "string" ? body.fileId.trim() : "";
  if (!fileId) return NextResponse.json({ error: "No Drive file was given." }, { status: 400 });

  const result = await mintAccessToken(user.id);
  if ("error" in result) return NextResponse.json({ error: "Reconnect your Google Drive first." }, { status: 409 });

  const emails = await reviewerEmails(result.email);
  const mode = await shareFileWithReviewers(result.accessToken, fileId, emails);
  const meta = await fileMetadata(result.accessToken, fileId);

  return NextResponse.json({
    mode,
    url: meta?.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    name: meta?.name ?? null,
  });
}
