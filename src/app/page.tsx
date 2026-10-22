import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Compass, Award } from "lucide-react";
import { RichText } from "@/components/RichText";
import { getCurrentUser } from "@/lib/auth";
import { getAllBadges, getPrograms } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const settings = await getSettings();
  const user = await getCurrentUser();
  const [programs, badges] = await Promise.all([getPrograms(), getAllBadges()]);

  return (
    <div className="overflow-hidden">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          {settings.logoUrl ? (
            <img src={settings.logoUrl} alt="" className="h-12 w-12 rounded-[18px] bg-white object-contain" />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-[var(--accent)] text-2xl">⚜️</span>
          )}
          <div>
            <p className="font-display text-xl leading-none">{settings.siteName}</p>
            <p className="text-xs font-bold text-[var(--muted)]">{settings.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/advancement" className="bloom-btn">
              Open portal
            </Link>
          ) : (
            <>
              <Link href="/login" className="bloom-btn secondary">
                Log in
              </Link>
              <Link href="/register" className="bloom-btn hidden sm:inline-flex">
                Join free
              </Link>
            </>
          )}
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-8 md:grid-cols-2 md:py-14">
        <div>
          <p className="sticker mb-4">
            <Sparkles size={14} /> Laging Handa — always prepared
          </p>
          <h1 className="font-display text-4xl leading-[1.05] font-semibold sm:text-6xl">
            Earn your ranks and merit badges, one requirement at a time.
          </h1>
          <div className="mt-5 max-w-lg text-lg text-[var(--muted)]">
            <RichText value={settings.welcomeMessage} />
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={user ? "/advancement" : "/register"} className="bloom-btn">
              Start the trail <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="bloom-btn secondary">
              Try a demo account
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <span className="chip">⚜️ {programs.length} programs</span>
            <span className="chip">🎖️ {badges.length} badges</span>
            <span className="chip">🎥 Video &amp; photo proof</span>
          </div>
        </div>
        <div className="relative">
          <div className="blob h-40 w-40 bg-[var(--accent)] -top-6 -left-4" />
          <div className="blob right-4 bottom-4 h-32 w-32 bg-[var(--mint)]" />
          <img
            src="/images/hero.svg"
            alt="Scouts camping under a bright sky"
            className="floaty relative z-10 w-full rounded-[36px] border-4 border-white shadow-[10px_12px_0_rgba(28,51,20,0.12)]"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-12 md:grid-cols-3">
        {[
          {
            icon: <Compass size={18} />,
            title: "Pick a program",
            text: "KID, Boy, Senior, and Rover Scouts — each with its own ranks and merit badges.",
          },
          {
            icon: <Shield size={18} />,
            title: "Complete requirements",
            text: "Recite, record a video, answer a quiz, or upload proof. Submit when you are ready.",
          },
          {
            icon: <Award size={18} />,
            title: "Two approvals",
            text: "Your Scout Leader confirms first, then a Council Admin awards the badge.",
          },
        ].map((item) => (
          <article key={item.title} className="bloom-card p-6">
            <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-[var(--accent)]">{item.icon}</div>
            <h2 className="font-display text-2xl">{item.title}</h2>
            <p className="mt-2 text-[var(--muted)]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="sticker">Scouting programs</p>
            <h2 className="font-display mt-3 text-3xl">Choose where you belong</h2>
          </div>
          <Link href={user ? "/advancement" : "/login"} className="bloom-btn secondary">
            See advancement
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {programs.map((program) => {
            const count = badges.filter((badge) => badge.programId === program.id).length;
            return (
              <article key={program.id} className="bloom-card overflow-hidden">
                <div className="flex h-24 items-center justify-center text-4xl" style={{ background: `${program.color}33` }}>
                  {program.icon}
                </div>
                <div className="p-4">
                  <p className="text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">{program.ageRange}</p>
                  <h3 className="font-display text-xl leading-tight">{program.name}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-[var(--muted)]">{program.description}</p>
                  <p className="mt-3 text-xs font-extrabold text-[var(--muted)]">{count} badges</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
