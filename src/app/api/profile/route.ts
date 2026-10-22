import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser, jsonError } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);
  const body = (await request.json()) as {
    profileBio?: string;
    phone?: string;
    address?: string;
    education?: string;
    professionalHeadline?: string;
    resumeSummary?: string;
    skills?: string;
    experience?: string;
    birthDate?: string;
  };
  await db
    .update(users)
    .set({
      profileBio: body.profileBio?.slice(0, 500) ?? null,
      phone: body.phone?.slice(0, 50) ?? null,
      address: body.address?.slice(0, 500) ?? null,
      education: body.education?.slice(0, 1000) ?? null,
      professionalHeadline: body.professionalHeadline?.slice(0, 180) ?? null,
      resumeSummary: body.resumeSummary?.slice(0, 3000) ?? null,
      skills: body.skills?.slice(0, 1500) ?? null,
      experience: body.experience?.slice(0, 5000) ?? null,
      birthDate: body.birthDate || null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  return Response.json({ ok: true });
}
