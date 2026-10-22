import Link from "next/link";
import { db } from "@/db";
import { levels, settings } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";
import { normalizeLandingContent } from "@/lib/landing";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

function BannerImage({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  if (src) return <img src={src} alt={alt} className={className} />;
  return (
    <div
      aria-hidden
      className={`${className} bg-gradient-to-br from-[#1E4488] via-[#1B365F] to-[#0F2440]`}
    />
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const academy = (await db.select().from(settings).limit(1))[0];
  const program = await db.select().from(levels).orderBy(levels.number);
  const fee = formatMoney(academy?.registrationFeeCents ?? 18500, academy?.currency ?? "PHP");
  const dashHref = user?.role === "admin" ? "/admin" : "/dashboard";
  const content = normalizeLandingContent(academy?.landingContent);

  return (
    <div className="bg-[#1B365F] text-[#F7F9FD]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandMark light name={academy?.academyName} />
        <nav className="flex items-center gap-3 text-sm">
          {user ? (
            <Link href={dashHref} className="btn btn-gold">Open workspace</Link>
          ) : (
            <>
              <Link href="/login" className="btn border border-white/20 bg-white/10 text-white transition hover:bg-white/20">Sign in</Link>
              <Link href="/register" className="btn btn-gold">Begin registration</Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-6 pb-20 pt-8">
        <BannerImage src={content.hero.image} alt={content.hero.imageAlt} className="h-[570px] w-full rounded-[36px] object-cover" />
        <div className="absolute inset-6 flex max-w-xl flex-col justify-end rounded-[36px] bg-[#1B365F]/88 p-10">
          <p className="text-xs uppercase tracking-[0.28em] text-[#FFCF00]">{content.hero.eyebrow}</p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] text-white md:text-6xl">{content.hero.heading}</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-[#F7F9FD]/84">{content.hero.paragraph}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-gold">{content.hero.primaryCta}</Link>
            <Link href="/login" className="btn border border-white/20 bg-white/8 text-white">{content.hero.secondaryCta}</Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FB] py-20 text-[#1B365F]">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6b7280]">{content.companion.eyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl">{content.companion.heading}</h2>
            <p className="mt-4 text-lg leading-8 text-[#52657A]">{content.companion.paragraph}</p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {content.companion.features.map((feature, index) => (
                <article key={index} className="rounded-3xl bg-white p-5 shadow-[0_20px_50px_rgba(17,44,70,0.06)]">
                  <h3 className="font-serif text-xl">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#64758A]">{feature.copy}</p>
                </article>
              ))}
            </div>
          </div>
          <BannerImage src={content.companion.image} alt={content.companion.imageAlt} className="h-full min-h-[420px] rounded-[32px] object-cover" />
        </div>
      </section>

      <section className="bg-[#1E4488] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#FFCF00]">{content.levels.eyebrow}</p>
              <h2 className="mt-3 font-serif text-4xl text-white">{content.levels.heading}</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#F7F9FD]/75">{content.levels.paragraph.replaceAll("{fee}", fee)}</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {program.map((level) => (
              <article key={level.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[#FFCF00]">Level {level.number}</p>
                <h3 className="mt-3 font-serif text-2xl text-white">{level.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#F7F9FD]/75">{level.description}</p>
                <p className="mt-5 text-xs uppercase tracking-[0.14em] text-[#FFCF00]">{level.studyDays} study days · {level.examDays} exam days · {level.requiredScore}% to pass</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F5F7FB] py-20 text-[#1B365F]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
          <BannerImage src={content.registration.image} alt={content.registration.imageAlt} className="h-[420px] w-full rounded-[32px] object-cover" />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#6b7280]">{content.registration.eyebrow}</p>
            <h2 className="mt-3 font-serif text-4xl">{content.registration.heading}</h2>
            <p className="mt-4 text-lg leading-8 text-[#52657A]">{content.registration.paragraph}</p>
            <Link href="/register" className="btn btn-dark mt-8">{content.registration.cta}</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-10 text-sm text-[#F7F9FD]/65">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <BrandMark light name={academy?.academyName} />
          <p>{content.footer.note}</p>
        </div>
      </footer>
    </div>
  );
}
