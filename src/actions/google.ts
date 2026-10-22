"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function disconnectDriveAction() {
  const user = await requireUser();
  await db
    .update(users)
    .set({ googleEmail: null, googleRefreshToken: null, googleFolderId: null, googleConnectedAt: null })
    .where(eq(users.id, user.id));
  revalidatePath("/profile");
  revalidatePath("/advancement");
}
