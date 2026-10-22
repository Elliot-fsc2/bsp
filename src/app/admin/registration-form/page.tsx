import { db } from "@/db";
import { settings } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { RegistrationFormEditor } from "@/components/admin/RegistrationFormEditor";
import { requireAdminPage } from "@/lib/guards";
import { normalizeRegistrationForm } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

export default async function AdminRegistrationFormPage() {
  const admin = await requireAdminPage();
  const academy = (await db.select().from(settings).limit(1))[0];
  const form = normalizeRegistrationForm(academy?.registrationForm);

  return (
    <AppShell user={admin} nav={adminNav} title="Registration form">
      <div className="mx-auto max-w-4xl">
        <RegistrationFormEditor form={form} />
      </div>
    </AppShell>
  );
}
