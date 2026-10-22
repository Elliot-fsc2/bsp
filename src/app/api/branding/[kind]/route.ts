import { NextRequest } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { isBrandAssetKind, loadBrandAsset } from "@/lib/branding";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ kind: string }> }) {
  const { kind } = await context.params;
  if (!isBrandAssetKind(kind)) return new Response("Not found", { status: 404 });

  const current = (await db.select().from(settings).limit(1))[0];
  const filename = kind === "logo" ? current?.logoFilename : current?.faviconFilename;
  const asset = await loadBrandAsset(kind, filename);
  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
