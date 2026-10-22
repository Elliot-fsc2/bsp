"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  DEFAULT_REGISTRATION_FORM,
  type RegistrationField,
  type RegistrationFieldType,
  type RegistrationFormContent,
} from "@/lib/registration-form";

const FIELD_TYPES: { value: RegistrationFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "password", label: "Password" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "textarea", label: "Paragraph" },
  { value: "select", label: "Dropdown" },
  { value: "location", label: "Map location" },
];

function newFieldKey(): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `custom_${random}`;
}

export function RegistrationFormEditor({ form: initialForm }: { form: RegistrationFormContent }) {
  const router = useRouter();
  const [form, setForm] = useState<RegistrationFormContent>(initialForm);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setIntro = (patch: Partial<Omit<RegistrationFormContent, "fields">>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const setField = (index: number, patch: Partial<RegistrationField>) =>
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    }));

  function addField() {
    setForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          key: newFieldKey(),
          label: "New field",
          type: "text",
          required: false,
          visible: true,
          system: false,
        },
      ],
    }));
  }

  function removeField(index: number) {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== index),
    }));
  }

  function moveField(index: number, direction: -1 | 1) {
    setForm((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.fields.length) return prev;
      const fields = [...prev.fields];
      [fields[index], fields[target]] = [fields[target], fields[index]];
      return { ...prev, fields };
    });
  }

  function resetToDefaults() {
    setForm(DEFAULT_REGISTRATION_FORM);
    setNotice("");
    setError("");
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/admin/registration-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form }),
      });
      const body = (await response.json()) as { error?: string; form?: RegistrationFormContent };
      if (!response.ok) {
        setError(body.error ?? "Could not save the registration form.");
        return;
      }
      if (body.form) setForm(body.form);
      setNotice("Registration form saved.");
      router.refresh();
    } catch {
      setError("Could not save the registration form. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">01 / Page copy</p>
        <h3 className="mb-5 mt-1 font-serif text-2xl text-[#1B365F]">What applicants read</h3>
        <div className="grid gap-4">
          <TextField label="Eyebrow" value={form.eyebrow} maxLength={120} onChange={(value) => setIntro({ eyebrow: value })} />
          <TextField label="Heading" value={form.heading} maxLength={200} onChange={(value) => setIntro({ heading: value })} />
          <TextAreaField label="Description" value={form.paragraph} maxLength={1600} onChange={(value) => setIntro({ paragraph: value })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Form eyebrow" value={form.formEyebrow} maxLength={120} onChange={(value) => setIntro({ formEyebrow: value })} />
            <TextField label="Form title" value={form.formTitle} maxLength={200} onChange={(value) => setIntro({ formTitle: value })} />
          </div>
          <TextAreaField label="Form intro" value={form.formBlurb} maxLength={1200} onChange={(value) => setIntro({ formBlurb: value })} />
        </div>
      </section>

      <section className="rounded-[26px] bg-white p-6 shadow-sm md:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0076AF]">02 / Form fields</p>
        <h3 className="mt-1 font-serif text-2xl text-[#1B365F]">Fields shown on the form</h3>
        <p className="mt-2 text-sm text-[#708099]">
          Rename, reorder, hide, or delete fields, and add your own. Full name, email, and password are
          required and cannot be removed.
        </p>

        <div className="mt-5 space-y-3">
          {form.fields.map((field, index) => (
            <div key={field.key} className="rounded-2xl border border-[#e3eaf4] bg-[#F5F7FB] p-4">
              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-[180px] flex-1 text-sm font-medium text-[#1B365F]">
                  Label
                  <input
                    className="input mt-2"
                    value={field.label}
                    maxLength={120}
                    onChange={(event) => setField(index, { label: event.target.value })}
                  />
                </label>
                <label className="w-36 text-sm font-medium text-[#1B365F]">
                  Type
                  <select
                    className="input mt-2"
                    value={field.type}
                    disabled={field.system}
                    onChange={(event) => setField(index, { type: event.target.value as RegistrationFieldType })}
                  >
                    {FIELD_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-4 pb-3 text-sm text-[#1B365F]">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      disabled={field.system}
                      onChange={(event) => setField(index, { required: event.target.checked })}
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={field.visible}
                      disabled={field.system}
                      onChange={(event) => setField(index, { visible: event.target.checked })}
                    />
                    Visible
                  </label>
                </div>
                <div className="flex items-center gap-1 pb-2">
                  <button type="button" className="rounded-lg p-2 text-[#708099] hover:bg-white" onClick={() => moveField(index, -1)} disabled={index === 0} aria-label="Move up">
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" className="rounded-lg p-2 text-[#708099] hover:bg-white" onClick={() => moveField(index, 1)} disabled={index === form.fields.length - 1} aria-label="Move down">
                    <ArrowDown size={16} />
                  </button>
                  {field.system ? (
                    <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#8a93a6]">Required</span>
                  ) : (
                    <button type="button" className="rounded-lg p-2 text-[#AC242A] hover:bg-white" onClick={() => removeField(index)} aria-label="Delete field">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {field.type === "select" ? (
                <label className="mt-3 block text-sm font-medium text-[#1B365F]">
                  Options (one per line)
                  <textarea
                    className="input mt-2"
                    rows={3}
                    value={(field.options ?? []).join("\n")}
                    onChange={(event) => setField(index, { options: event.target.value.split("\n") })}
                  />
                </label>
              ) : null}

              <p className="mt-2 text-xs text-[#8a93a6]">
                Key: <span className="font-mono">{field.key}</span>
              </p>
            </div>
          ))}
        </div>

        <button type="button" className="btn mt-4 border border-[#dce5f1] bg-white text-[#1B365F]" onClick={addField}>
          <Plus size={16} /> Add field
        </button>
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_18px_40px_rgba(17,44,70,0.14)] backdrop-blur">
        <button className="btn btn-dark" disabled={saving} type="submit">
          <Save size={16} /> {saving ? "Saving…" : "Save registration form"}
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
