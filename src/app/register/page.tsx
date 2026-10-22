import Link from "next/link";
import { RegisterForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const settings = await getSettings();
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  if (!settings.allowRegistration) redirect("/login");
  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-2">
      <div>
        <Link href="/" className="sticker">
          ⚜️ {settings.siteName}
        </Link>
        <h1 className="font-display mt-6 text-5xl leading-tight">Join the Scouting movement.</h1>
        <p className="mt-4 text-lg text-[var(--muted)]">New members join as Scouts. Scout Leaders and Council Admins are invited by the council office.</p>
      </div>
      <div className="bloom-card p-7 md:p-8">
        <h2 className="font-display text-3xl">Create account</h2>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">It takes less time than tying a square knot.</p>
        <RegisterForm />
      </div>
    </div>
  );
}
