"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  DEFAULT_LANDING_CONTENT,
  type LandingContent,
  type LandingFeature,
} from "@/lib/landing";

type Slot = "hero" | "companion" | "registration";

const SLOTS: Slot[] = ["hero", "companion", "registration"];

export function LandingPageForm({ content }: { content: LandingContent }) {
  const router = useRouter();
  const [form, setForm] = useState<LandingContent>(content);
  const [files, setFiles] = useState<Record<Slot, File | null>>({
    hero: null,
    companion: null,
    registration: null,
  });
  const [removed, setRemoved] = useState<Record<Slot, boolean>>({
    hero: false,
    companion: false,
    registration: false,
  });
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setHero = (patch: Partial<LandingContent["hero"]>) =>
    setForm((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  const setCompanion = (patch: Partial<Omit<LandingContent["companion"], "features">>) =>
    setForm((prev) => ({ ...prev, companion: { ...prev.companion, ...patch } }));
  const setLevels = (patch: Partial<LandingContent["levels"]>) =>
    setForm((prev) => ({ ...prev, levels: { ...prev.levels, ...patch } }));
  const setRegistration = (patch: Partial<LandingContent["registration"]>) =>
    setForm((prev) => ({ ...prev, registration: { ...prev.registration, ...patch } }));
  const setFooter = (patch: Partial<LandingContent["footer"]>) =>
    setForm((prev) => ({ ...prev, footer: { ...prev.footer, ...patch } }));
  const setFeature = (index: number, patch: Partial<LandingFeature>) =>
    setForm((prev) => ({
      ...prev,
      companion: {
        ...prev.companion,
        features: prev.companion.features.map((feature, i) =>
          i === index ? { ...feature, ...patch } : feature,
        ),
      },
    }));

  function pickFile(slot: Slot, file: File | null) {
    setFiles((prev) => ({ ...prev, [slot]: file }));
    if (file) setRemoved((prev) => ({ ...prev, [slot]: false }));
  }

  function removeSlot(slot: Slot) {
    setFiles((prev) => ({ ...prev, [slot]: null }));
    setRemoved((prev) => ({ ...prev, [slot]: true }));
  }

  function resetToDefaults() {
    setForm(DEFAULT_LANDING_CONTENT);
    setFiles({ hero: null, companion: null, registration: null });
    setRemoved({ hero: false, companion: false, registration: false });
    setNotice("");
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const data = new FormData();
      data.set("content", JSON.stringify(form));
      for (const slot of SLOTS) {
        const file = files[slot];
        if (file) data.set(slot, file);
        if (removed[slot]) data.set(`remove_${slot}`, "1");
      }
      const response = await fetch("/api/admin/landing", { method: "POST", body: data });
      const body = (await response.json()) as { error?: string; content?: LandingContent };
      if (!response.ok) {
        setError(body.error ?? "Could not save the landing page.");
        return;
      }
      if (body.content) setForm(body.content);
      setFiles({ hero: null, companion: null, registration: null });
      setRemoved({ hero: false, companion: false, registration: false });
      setNotice("Landing page saved.");
      router.refresh();
    } catch {
      setError("Could not save the landing page. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">01 / Hero</p>
        <h3 className="mb-5 mt-1 font-serif text-2xl text-[#1B365F]">Top of the landing page</h3>
        <div className="grid gap-4">
          <TextField label="Eyebrow" value={form.hero.eyebrow} maxLength={120} onChange={(value) => setHero({ eyebrow: value })} />
          <TextField label="Heading" value={form.hero.heading} maxLength={200} onChange={(value) => setHero({ heading: value })} />
          <TextAreaField label="Paragraph" value={form.hero.paragraph} maxLength={1200} onChange={(value) => setHero({ paragraph: value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Primary button label" value={form.hero.primaryCta} maxLength={60} onChange={(value) => setHero({ primaryCta: value })} />
            <TextField label="Secondary button label" value={form.hero.secondaryCta} maxLength={60} onChange={(value) => setHero({ secondaryCta: value })} />
          </div>
          <ImageField
            label="Hero banner"
            image={form.hero.image}
            file={files.hero}
            removed={removed.hero}
            onFile={(file) => pickFile("hero", file)}
            onRemove={() => removeSlot("hero")}
          />
          <TextField label="Banner alt text" value={form.hero.imageAlt} maxLength={200} onChange={(value) => setHero({ imageAlt: value })} />
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">02 / Companion section</p>
        <h3 className="mb-5 mt-1 font-serif text-2xl text-[#1B365F]">Feature highlights</h3>
        <div className="grid gap-4">
          <TextField label="Eyebrow" value={form.companion.eyebrow} maxLength={120} onChange={(value) => setCompanion({ eyebrow: value })} />
          <TextField label="Heading" value={form.companion.heading} maxLength={200} onChange={(value) => setCompanion({ heading: value })} />
          <TextAreaField label="Paragraph" value={form.companion.paragraph} maxLength={1200} onChange={(value) => setCompanion({ paragraph: value })} />
          <ImageField
            label="Section image"
            image={form.companion.image}
            file={files.companion}
            removed={removed.companion}
            onFile={(file) => pickFile("companion", file)}
            onRemove={() => removeSlot("companion")}
          />
          <TextField label="Image alt text" value={form.companion.imageAlt} maxLength={200} onChange={(value) => setCompanion({ imageAlt: value })} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {form.companion.features.map((feature, index) => (
            <div key={index} className="rounded-2xl border border-[#e3eaf4] bg-[#F5F7FB] p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#708099]">Card {index + 1}</p>
              <TextField label="Title" value={feature.title} maxLength={120} onChange={(value) => setFeature(index, { title: value })} />
              <div className="mt-3">
                <TextAreaField label="Copy" value={feature.copy} maxLength={500} rows={3} onChange={(value) => setFeature(index, { copy: value })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">03 / Levels intro</p>
        <h3 className="mb-5 mt-1 font-serif text-2xl text-[#1B365F]">The leadership climb</h3>
        <div className="grid gap-4">
          <TextField label="Eyebrow" value={form.levels.eyebrow} maxLength={120} onChange={(value) => setLevels({ eyebrow: value })} />
          <TextField label="Heading" value={form.levels.heading} maxLength={200} onChange={(value) => setLevels({ heading: value })} />
          <TextAreaField
            label="Paragraph"
            value={form.levels.paragraph}
            maxLength={1200}
            hint="Use {fee} anywhere to insert the registration fee, e.g. “Registration is {fee}.”"
            onChange={(value) => setLevels({ paragraph: value })}
          />
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">04 / Registration block</p>
        <h3 className="mb-5 mt-1 font-serif text-2xl text-[#1B365F]">Verified and supported</h3>
        <div className="grid gap-4">
          <TextField label="Eyebrow" value={form.registration.eyebrow} maxLength={120} onChange={(value) => setRegistration({ eyebrow: value })} />
          <TextField label="Heading" value={form.registration.heading} maxLength={200} onChange={(value) => setRegistration({ heading: value })} />
          <TextAreaField label="Paragraph" value={form.registration.paragraph} maxLength={1200} onChange={(value) => setRegistration({ paragraph: value })} />
          <TextField label="Button label" value={form.registration.cta} maxLength={60} onChange={(value) => setRegistration({ cta: value })} />
          <ImageField
            label="Section image"
            image={form.registration.image}
            file={files.registration}
            removed={removed.registration}
            onFile={(file) => pickFile("registration", file)}
            onRemove={() => removeSlot("registration")}
          />
          <TextField label="Image alt text" value={form.registration.imageAlt} maxLength={200} onChange={(value) => setRegistration({ imageAlt: value })} />
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">05 / Footer</p>
        <h3 className="mb-5 mt-1 font-serif text-2xl text-[#1B365F]">Footer note</h3>
        <TextField label="Note" value={form.footer.note} maxLength={300} onChange={(value) => setFooter({ note: value })} />
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_18px_40px_rgba(17,44,70,0.14)] backdrop-blur">
        <button className="btn btn-dark" disabled={saving} type="submit">
          <Save size={16} /> {saving ? "Saving…" : "Save landing page"}
        </button>
        <button className="btn border border-[#dce5f1] bg-white text-[#1B365F]" type="button" onClick={resetToDefaults} disabled={saving}>
          <RotateCcw size={16} /> Reset to defaults
        </button>
        {notice ? (
          <span role="status" className="inline-flex items-center gap-1.5 text-sm text-[#00694B]">
            <CheckCircle2 size={16} /> {notice}
          </span>
        ) : null}
        {error ? <span role="alert" className="text-sm text-[#AC242A]">{error}</span> : null}
      </div>
    </form>
  );
}

function TextField({
  label,
  value,
  onChange,
  hint,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm font-medium text-[#1B365F]">
      {label}
      <input className="input mt-2" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />
      {hint ? <span className="mt-1 block text-xs font-normal text-[#708099]">{hint}</span> : null}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  hint,
  maxLength,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  maxLength?: number;
  rows?: number;
}) {
  return (
    <label className="block text-sm font-medium text-[#1B365F]">
      {label}
      <textarea
        className="input mt-2"
        rows={rows}
        value={value}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? <span className="mt-1 block text-xs font-normal text-[#708099]">{hint}</span> : null}
    </label>
  );
}

function ImageField({
  label,
  image,
  file,
  removed,
  onFile,
  onRemove,
}: {
  label: string;
  image: string | null;
  file: File | null;
  removed: boolean;
  onFile: (file: File | null) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const preview = objectUrl ?? (removed ? null : image);

  return (
    <div className="rounded-2xl border border-[#e3eaf4] bg-[#F5F7FB] p-4">
      <p className="text-sm font-medium text-[#1B365F]">{label}</p>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <div className="grid h-24 w-40 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#dce5f1] bg-white">
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-[#8a93a6]">No image</span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn btn-dark" onClick={() => inputRef.current?.click()}>
            <ImagePlus size={16} /> {preview ? "Change image" : "Upload image"}
          </button>
          {preview ? (
            <button type="button" className="btn border border-[#dce5f1] bg-white text-[#AC242A]" onClick={onRemove}>
              <Trash2 size={16} /> Remove
            </button>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-xs text-[#708099]">
        {file
          ? `Selected: ${file.name}`
          : removed
            ? "Removed on save — the site will show a placeholder."
            : "PNG, JPG or WEBP up to 6 MB. Empty slots show a branded placeholder."}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
      />
    </div>
  );
}
