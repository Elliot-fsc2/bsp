import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, users } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { ProfileSettings } from "@/components/ProfileSettings";
import { requireActiveOrPausedMember } from "@/lib/guards";
import { normalizeRegistrationForm, parseAnswers } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireActiveOrPausedMember();
  const academy = (await db.select().from(settings).limit(1))[0];
  const form = normalizeRegistrationForm(academy?.registrationForm);
  const row = (await db.select({ answers: users.registrationAnswers }).from(users).where(eq(users.id, user.id)).limit(1))[0];

  return (
    <AppShell user={user} nav={studentNav} title="My profile">
      <ProfileSettings user={user} form={form} answers={parseAnswers(row?.answers)} />
    </AppShell>
  );
}
