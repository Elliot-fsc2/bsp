import { Palette, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { BrandingUploads } from "@/components/admin/BrandingUploads";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdminPage } from "@/lib/guards";

export const dynamic = "force-dynamic";

const colors = [
  { name: "Oxford Blue", hex: "#1E4488" },
  { name: "Crown Gold", hex: "#FFCF00" },
  { name: "Sapphire Blue", hex: "#0076AF" },
  { name: "Ruby Red", hex: "#AC242A" },
];

export default async function AdminSettingsPage() {
  const admin = await requireAdminPage();
  const academy = (await db.select().from(settings).limit(1))[0];

  return (
    <AppShell user={admin} nav={adminNav} title="Site settings">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="relative overflow-hidden rounded-[28px] bg-[#1B365F] p-7 text-white">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border-[44px] border-white/5" />
          <div className="pointer-events-none absolute bottom-0 right-28 h-24 w-24 rounded-full bg-[#FFCF00]/15 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFCF00] text-[#1B365F]">
              <Palette size={22} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FFCF00]">Appearance & configuration</p>
              <h2 className="mt-1 font-serif text-3xl">Make the pathway yours.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                Your logo appears across the site. Your tab icon updates the browser tab. Academy and payment details are saved separately below.
              </p>
            </div>
          </div>
        </div>

        <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">01 / Visual identity</p>
              <h3 className="mt-1 font-serif text-2xl text-[#1B365F]">Logo & browser tab icon</h3>
            </div>
            <ShieldCheck size={25} className="hidden text-[#1E4488] sm:block" />
          </div>
          <BrandingUploads logoFilename={academy?.logoFilename ?? null} faviconFilename={academy?.faviconFilename ?? null} />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(270px,.7fr)]">
          <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">02 / Academy details</p>
            <h3 className="mb-5 mt-1 font-serif text-2xl text-[#1B365F]">Registration & payment</h3>
            <SettingsForm
              settings={
                academy ?? {
                  academyName: "DeMolay Nexus",
                  tagline: "Character. Leadership. Brotherhood. Service.",
                  announcement: "",
                  examNote: "",
                  registrationFeeCents: 18500,
                  retakeFeeCents: 9500,
                  reinstatementFeeCents: 12500,
                  currency: "PHP",
                  timeZone: "UTC",
                  bankName: "",
                  accountName: "",
                  accountNumber: "",
                  paymentInstructions: "",
                  googleMapsApiKey: "",
                }
              }
            />
          </section>

          <aside className="h-fit rounded-[26px] bg-white p-6 shadow-sm md:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">DeMolay brand guide</p>
            <h3 className="mb-4 mt-1 font-serif text-2xl text-[#1B365F]">Our colors</h3>
            <div className="space-y-3">
              {colors.map((color) => (
                <div key={color.name} className="flex items-center gap-3 rounded-2xl border border-[#e3eaf4] p-2.5">
                  <span className="h-10 w-10 shrink-0 rounded-xl shadow-sm" style={{ backgroundColor: color.hex }} />
                  <div>
                    <p className="text-sm font-semibold text-[#1B365F]">{color.name}</p>
                    <p className="font-mono text-xs text-[#708099]">{color.hex}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-[#708099]">
              Official DeMolay International palette. Oxford Blue leads the interface; Crown Gold calls attention to key actions.
            </p>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
