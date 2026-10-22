"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Banknote, CheckCircle2, Globe2, MapPin, Megaphone, NotebookPen, Save, Timer } from "lucide-react";
import { FALLBACK_TIME_ZONES, supportedTimeZones } from "@/lib/time";
import { EXAM_NOTE_DEFAULT } from "@/lib/defaults";

type Settings = {
  academyName: string;
  tagline: string | null;
  announcement: string | null;
  examNote: string | null;
  registrationFeeCents: number;
  retakeFeeCents: number;
  reinstatementFeeCents: number;
  currency: string;
  timeZone: string;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  paymentInstructions: string | null;
  googleMapsApiKey: string | null;
};

const CURRENCIES = ["USD", "EUR", "GBP", "PHP", "INR", "NGN", "KES", "GHS", "ZAR", "CAD", "AUD", "NZD", "JPY", "CNY", "SGD", "MYR", "IDR", "THB", "PKR", "BDT", "AED", "SAR", "BRL", "MXN", "COP", "ARS", "CHF", "SEK", "NOK", "DKK", "PLN", "TRY", "EGP"];

function FeeField({ label, icon: Icon, cents, currency, onChange }: { label: string; icon: typeof Banknote; cents: number; currency: string; onChange: (value: number) => void }) {
  const [text, setText] = useState((cents / 100).toFixed(2));
  return (
    <label className="block text-sm font-medium text-[#1B365F]">
      <span className="inline-flex items-center gap-1.5"><Icon size={15} className="text-[#0076AF]" /> {label}</span>
      <div className="relative mt-2">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#708099]">{currency}</span>
        <input
          className="input"
          style={{ paddingLeft: "3.6rem" }}
          type="number"
          min={0}
          step="0.01"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            onChange(Math.round(Number(event.target.value || 0) * 100));
          }}
        />
      </div>
    </label>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const zones = useMemoZones();

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not save settings.");
        return;
      }
      setNotice("Settings saved. Currency, time zone, and fees are live.");
      router.refresh();
    } catch {
      setError("Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-[#1B365F] sm:col-span-2">
          Academy name
          <input className="input mt-2" value={form.academyName} onChange={(event) => setForm({ ...form, academyName: event.target.value })} required />
        </label>
        <label className="block text-sm font-medium text-[#1B365F] sm:col-span-2">
          Tagline
          <input className="input mt-2" value={form.tagline ?? ""} onChange={(event) => setForm({ ...form, tagline: event.target.value })} />
        </label>
      </div>

      <div className="rounded-2xl border border-[#FFCF00]/50 bg-[#FFFBEB] p-4">
        <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365F]"><Megaphone size={16} className="text-[#0076AF]" /> Announcement banner</p>
        <label className="block text-sm font-medium text-[#1B365F]">
          Message shown at the top of the student Overview
          <textarea
            className="input mt-2 min-h-[88px]"
            maxLength={2000}
            placeholder="e.g. Reminder: the Level 2 exam window closes this Sunday. Study up, brothers!"
            value={form.announcement ?? ""}
            onChange={(event) => setForm({ ...form, announcement: event.target.value })}
          />
        </label>
        <p className="mt-2 text-xs text-[#6b7280]">Leave blank to hide the banner. Students see this immediately on opening the app.</p>
      </div>

      <div className="rounded-2xl border border-[#e3eaf4] bg-[#F5F7FB] p-4">
        <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365F]"><NotebookPen size={16} className="text-[#0076AF]" /> Exam notes</p>
        <label className="block text-sm font-medium text-[#1B365F]">
          Note students can open while sitting an exam
          <textarea className="input mt-2 min-h-[120px]" maxLength={4000} placeholder={EXAM_NOTE_DEFAULT} value={form.examNote ?? ""} onChange={(event) => setForm({ ...form, examNote: event.target.value })} />
        </label>
        <p className="mt-2 text-xs text-[#6b7280]">Leave blank to hide the notes button during exams. Good for instructions, reminders, or a word of encouragement.</p>
      </div>

      <div className="rounded-2xl border border-[#e3eaf4] bg-[#F5F7FB] p-4">
        <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365F]"><Banknote size={16} className="text-[#0076AF]" /> Fees & money</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <FeeField label="Registration fee" icon={Banknote} cents={form.registrationFeeCents} currency={form.currency} onChange={(value) => setForm({ ...form, registrationFeeCents: value })} />
          <FeeField label="Exam retake fee" icon={Timer} cents={form.retakeFeeCents} currency={form.currency} onChange={(value) => setForm({ ...form, retakeFeeCents: value })} />
          <FeeField label="Reinstatement fee" icon={Timer} cents={form.reinstatementFeeCents} currency={form.currency} onChange={(value) => setForm({ ...form, reinstatementFeeCents: value })} />
        </div>
        <label className="mt-4 block text-sm font-medium text-[#1B365F]">
          <span className="inline-flex items-center gap-1.5"><Globe2 size={15} className="text-[#0076AF]" /> Currency</span>
          <select className="input mt-2" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code} — {currencyName(code)}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-[#708099]">The first attempt at a level exam is included. The retake fee unlocks a second attempt; failing that attempt pauses access until the reinstatement fee is verified.</p>
      </div>

      <div className="rounded-2xl border border-[#e3eaf4] bg-[#F5F7FB] p-4">
        <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365F]"><Globe2 size={16} className="text-[#0076AF]" /> Regional format</p>
        <label className="block text-sm font-medium text-[#1B365F]">
          Time zone
          <select className="input mt-2" value={form.timeZone} onChange={(event) => setForm({ ...form, timeZone: event.target.value })}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>{zone}</option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs text-[#708099]" suppressHydrationWarning>
          Deadlines, attempts, and timestamps across the platform display in this zone. Now: {new Date().toLocaleString("en-US", { timeZone: form.timeZone })}
        </p>
      </div>

      <div className="rounded-2xl border border-[#e3eaf4] bg-[#F5F7FB] p-4">
        <p className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1B365F]"><MapPin size={16} className="text-[#0076AF]" /> Maps & location</p>
        <label className="block text-sm font-medium text-[#1B365F]">
          Google Maps API key
          <input
            className="input mt-2"
            maxLength={255}
            placeholder="AIza…"
            value={form.googleMapsApiKey ?? ""}
            onChange={(event) => setForm({ ...form, googleMapsApiKey: event.target.value })}
          />
        </label>
        <p className="mt-2 text-xs text-[#708099]">
          Enables the map location picker on the registration form. In Google Cloud, enable the <strong>Maps JavaScript API</strong> and{" "}
          <strong>Places API</strong> for this key, then restrict it to your site. Leave blank to fall back to a plain address field.
        </p>
      </div>

      <div className="rounded-2xl border border-[#e3eaf4] p-4">
        <p className="mb-4 text-sm font-semibold text-[#1B365F]">Offline payment details</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-[#1B365F]">
            Bank / payment channel
            <input className="input mt-2" value={form.bankName ?? ""} onChange={(event) => setForm({ ...form, bankName: event.target.value })} />
          </label>
          <label className="block text-sm font-medium text-[#1B365F]">
            Account name
            <input className="input mt-2" value={form.accountName ?? ""} onChange={(event) => setForm({ ...form, accountName: event.target.value })} />
          </label>
          <label className="block text-sm font-medium text-[#1B365F] sm:col-span-2">
            Account number / payment reference
            <input className="input mt-2" value={form.accountNumber ?? ""} onChange={(event) => setForm({ ...form, accountNumber: event.target.value })} />
          </label>
          <label className="block text-sm font-medium text-[#1B365F] sm:col-span-2">
            Payment instructions
            <textarea className="input mt-2 min-h-[120px]" value={form.paymentInstructions ?? ""} onChange={(event) => setForm({ ...form, paymentInstructions: event.target.value })} />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-dark" disabled={saving} type="submit">
          <Save size={16} /> {saving ? "Saving…" : "Save settings"}
        </button>
        {notice ? <span role="status" className="inline-flex items-center gap-1.5 text-sm text-[#00694B]"><CheckCircle2 size={16} /> {notice}</span> : null}
        {error ? <span role="alert" className="text-sm text-[#AC242A]">{error}</span> : null}
      </div>
    </form>
  );
}

function useMemoZones() {
  const [zones] = useState(() => {
    const supported = supportedTimeZones();
    const combined = supported.some((zone) => zone === "UTC") ? supported : ["UTC", ...FALLBACK_TIME_ZONES];
    return Array.from(new Set(combined));
  });
  return zones;
}

function currencyName(code: string) {
  const names: Record<string, string> = {
    USD: "US Dollar", EUR: "Euro", GBP: "Pound Sterling", PHP: "Philippine Peso", INR: "Indian Rupee",
    NGN: "Nigerian Naira", KES: "Kenyan Shilling", GHS: "Ghanaian Cedi", ZAR: "South African Rand",
    CAD: "Canadian Dollar", AUD: "Australian Dollar", NZD: "New Zealand Dollar", JPY: "Japanese Yen",
    CNY: "Chinese Yuan", SGD: "Singapore Dollar", MYR: "Malaysian Ringgit", IDR: "Indonesian Rupiah",
    THB: "Thai Baht", PKR: "Pakistani Rupee", BDT: "Bangladeshi Taka", AED: "UAE Dirham",
    SAR: "Saudi Riyal", BRL: "Brazilian Real", MXN: "Mexican Peso", COP: "Colombian Peso",
    ARS: "Argentine Peso", CHF: "Swiss Franc", SEK: "Swedish Krona", NOK: "Norwegian Krone",
    DKK: "Danish Krone", PLN: "Polish Zloty", TRY: "Turkish Lira", EGP: "Egyptian Pound",
  };
  return names[code] ?? code;
}
