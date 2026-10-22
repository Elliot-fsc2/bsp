"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, Check, ImagePlus, Save, Target } from "lucide-react";

type Level = {
  id: number;
  number: number;
  name: string;
  description: string | null;
  coverFilename: string | null;
  requiredScore: number;
  studyDays: number;
  examDays: number;
  isActive: boolean;
};

const COLORS = [
  "#1E4488",
  "#0076AF",
  "#1B365F",
  "#AC242A",
  "#005695",
];

export function LevelEditor({ level, lessonCount }: { level: Level; lessonCount: number }) {
  const router = useRouter();
  const [form, setForm] = useState(level);
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const data = new FormData();
      data.set("id", String(form.id));
      data.set("name", form.name);
      data.set("description", form.description ?? "");
      data.set("requiredScore", String(form.requiredScore));
      data.set("studyDays", String(form.studyDays));
      data.set("examDays", String(form.examDays));
      data.set("isActive", String(form.isActive));
      if (file) data.set("image", file);

      const response = await fetch("/api/admin/levels", {
        method: "POST",
        body: data,
      });
      const dataJson = (await response.json()) as { error?: string; coverFilename?: string };
      if (!response.ok) {
        setError(dataJson.error ?? "Could not save this level.");
        return;
      }
      if (dataJson.coverFilename) {
        setForm((prev) => ({ ...prev, coverFilename: dataJson.coverFilename ?? null }));
      }
      setFile(null);
      setNotice("Saved");
      router.refresh();
    } catch {
      setError("Could not save this level.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="flex h-full flex-col overflow-hidden rounded-[24px] border border-[#dce5f1] bg-white shadow-[0_12px_32px_rgba(30,68,136,0.05)]">
      <div className="relative overflow-hidden p-5 text-white" style={{ background: COLORS[(level.number - 1) % COLORS.length] }}>
        {form.coverFilename ? (
          <img src={form.coverFilename} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <span className="pointer-events-none absolute -bottom-14 right-0 h-40 w-40 rounded-full border-[24px] border-white/10" />
        <div className="relative flex items-start justify-between">
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em]">Level {String(level.number).padStart(2, "0")}</span>
          <span className="font-serif text-4xl font-bold text-white/30">0{level.number}</span>
        </div>
        <h2 className="relative mt-5 font-serif text-[26px] font-semibold leading-tight">{form.name}</h2>
        <p className="relative mt-1 inline-flex items-center gap-1.5 text-xs text-white/75"><BookOpen size={14} /> {lessonCount} lesson{lessonCount === 1 ? "" : "s"}</p>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#52657A] sm:col-span-2">
            Level name
            <input className="input mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>
          <label className="text-xs font-semibold text-[#52657A] sm:col-span-2">
            About this level
            <textarea className="input mt-2 min-h-[80px]" value={form.description ?? ""} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="text-xs font-semibold text-[#52657A] sm:col-span-2">
            Cover image
            <button
              type="button"
              className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b9c9e0] bg-[#F5F7FB] px-4 py-3 text-xs font-semibold text-[#1E4488]"
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus size={15} /> {file ? file.name : form.coverFilename ? "Change cover image" : "Upload cover image"}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="text-xs font-semibold text-[#52657A]">
            <span className="inline-flex items-center gap-1.5"><Target size={14} className="text-[#0076AF]" /> Required score %</span>
            <input
              className="input mt-2"
              type="number"
              min={1}
              max={100}
              value={form.requiredScore}
              onChange={(event) => setForm({ ...form, requiredScore: Number(event.target.value) })}
              required
            />
          </label>
          <label className="text-xs font-semibold text-[#52657A]">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} className="text-[#0076AF]" /> Study days</span>
            <input className="input mt-2" type="number" min={1} value={form.studyDays} onChange={(event) => setForm({ ...form, studyDays: Number(event.target.value) })} required />
          </label>
          <label className="text-xs font-semibold text-[#52657A]">
            Exam days
            <input className="input mt-2" type="number" min={1} value={form.examDays} onChange={(event) => setForm({ ...form, examDays: Number(event.target.value) })} required />
          </label>
          <label className="flex items-center gap-2 self-end rounded-xl bg-[#F4F7FB] px-3 py-3 text-xs font-semibold text-[#52657A]">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
            Active level
          </label>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-[#E8EEF5] pt-5">
          <button className="btn btn-dark py-2.5 text-xs" type="submit" disabled={busy}><Save size={15} /> {busy ? "Saving…" : "Save level"}</button>
          <Link href={`/admin/lessons?level=${level.number}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[#1E4488] hover:underline">View lessons <ArrowUpRight size={14} /></Link>
          {notice ? <span role="status" className="inline-flex items-center gap-1 text-xs font-semibold text-[#00694B]"><Check size={14} />{notice}</span> : null}
          {error ? <span role="alert" className="text-xs text-[#AC242A]">{error}</span> : null}
        </div>
      </div>
    </form>
  );
}
