import { db } from "@/db";
import { settings } from "@/db/schema";
import { RegisterForm } from "@/components/social/RegisterForm";
import { normalizeRegistrationForm } from "@/lib/registration-form";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const academy = (await db.select().from(settings).limit(1))[0];
  const form = normalizeRegistrationForm(academy?.registrationForm);
  const googleMapsApiKey = academy?.googleMapsApiKey?.trim() ?? "";

  return <RegisterForm form={form} googleMapsApiKey={googleMapsApiKey} />;
}
