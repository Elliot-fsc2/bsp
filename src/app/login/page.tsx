import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/AuthForms";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const settings = await getSettings();
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
  return (
    <div className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-5 py-10 md:grid-cols-2">
      <div className="hidden md:block">
        <Link href="/" className="sticker">
          ⚜️ {settings.siteName}
        </Link>
        <h1 className="font-display mt-6 text-5xl leading-tight">Laging Handa! Sign in and continue your Scouting journey.</h1>
        <p className="mt-4 text-lg text-[var(--muted)]">{settings.tagline}</p>
        <img src="/images/welcome.svg" alt="" className="floaty mt-8 w-full max-w-md" />
      </div>
      <div className="bloom-card p-7 md:p-8">
        <p className="sticker mb-4">Welcome back</p>
        <h2 className="font-display text-3xl">Log in to the BSP portal</h2>
        <p className="mt-2 mb-6 text-sm text-[var(--muted)]">Pick a demo account or use your own Scout credentials.</p>
        <LoginForm nextPath={next} />
      </div>
    </div>
  );
}
