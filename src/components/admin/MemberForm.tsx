"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { LocationPicker } from "@/components/social/LocationPicker";
import { buildMemberFields, parseAnswers, type RegistrationFormContent } from "@/lib/registration-form";
import { ACCOUNT_STATUS_LABELS, type AccountStatus } from "@/lib/types";

export type EditableMember = {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  education: string | null;
  accountStatus: string;
  registrationAnswers: Record<string, string> | null;
};

const STATUS_ORDER: AccountStatus[] = ["pending_payment", "pending_verification", "active", "suspended", "rejected"];
const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({ value, label: ACCOUNT_STATUS_LABELS[value] }));

export function Modal({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0b1f3a]/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-[#1B365F]/10 px-5 py-3">
          <p className="font-serif text-xl text-[#1B365F]">{title}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full bg-[#F3F6FA] text-[#6b7280] hover:bg-[#e9edf5]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-5">{children}</div>
        {footer ? <div className="flex flex-wrap items-center gap-2 border-t border-[#1B365F]/10 px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function MemberFormModal({ member, form: registrationForm, apiKey, onClose, onSaved }: { member: EditableMember | null; form: RegistrationFormContent; apiKey: string; onClose: () => void; onSaved: () => void }) {
  const extras = buildMemberFields(registrationForm);
  const [values, setValues] = useState({
    fullName: member?.fullName ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    address: member?.address ?? "",
    education: member?.education ?? "",
    accountStatus: member?.accountStatus ?? "pending_payment",
    password: "",
  });
  const [coords, setCoords] = useState({ latitude: member?.latitude ?? "", longitude: member?.longitude ?? "" });
  const [answers, setAnswers] = useState<Record<string, string>>(parseAnswers(member?.registrationAnswers));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const hasFullNameField = extras.some((item) => item.kind === "fullName");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const cleanAnswers: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) {
      if (typeof value === "string" && value.trim()) cleanAnswers[key] = value.trim();
    }
    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: member ? "update" : "create",
        id: member?.id,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        address: values.address,
        latitude: coords.latitude,
        longitude: coords.longitude,
        education: values.education,
        accountStatus: values.accountStatus,
        password: values.password,
        registrationAnswers: cleanAnswers,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(data.error ?? "Could not save the member.");
      return;
    }
    onSaved();
  }

  return (
    <Modal
      title={member ? `Edit ${member.fullName}` : "Add member"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-dark" type="submit" form="member-form" disabled={busy}>
            {busy ? "Saving…" : member ? "Save changes" : "Create member"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>
          {error ? <span className="text-sm text-[#AC242A]">{error}</span> : null}
        </>
      }
    >
      <form id="member-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        {!hasFullNameField ? (
          <label className="text-sm font-medium text-[#1B365F] sm:col-span-2">
            Full name
            <input className="input mt-2" value={values.fullName} onChange={(event) => setValues({ ...values, fullName: event.target.value })} required />
          </label>
        ) : null}

        {extras.map((item) =>
          item.kind === "fullName" ? (
            <label key={item.key} className="text-sm font-medium text-[#1B365F]">
              {item.label}
              <input className="input mt-2" value={values.fullName} onChange={(event) => setValues({ ...values, fullName: event.target.value })} required />
            </label>
          ) : item.kind === "select" ? (
            <label key={item.key} className="text-sm font-medium text-[#1B365F]">
              {item.label}
              <select
                className="input mt-2"
                value={answers[item.key] ?? ""}
                onChange={(event) => setAnswers({ ...answers, [item.key]: event.target.value })}
              >
                <option value="">—</option>
                {(item.options ?? []).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          ) : (
            <label key={item.key} className="text-sm font-medium text-[#1B365F]">
              {item.label}
              <input className="input mt-2" value={answers[item.key] ?? ""} onChange={(event) => setAnswers({ ...answers, [item.key]: event.target.value })} />
            </label>
          ),
        )}

        <label className="text-sm font-medium text-[#1B365F]">
          Email
          <input className="input mt-2" type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} required />
        </label>
        <label className="text-sm font-medium text-[#1B365F]">
          Account status
          <select className="input mt-2" value={values.accountStatus} onChange={(event) => setValues({ ...values, accountStatus: event.target.value })}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-[#1B365F]">
          Phone
          <input className="input mt-2" value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} />
        </label>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-[#1B365F]">Address</p>
          {apiKey ? (
            <LocationPicker
              apiKey={apiKey}
              name="address"
              value={values.address}
              placeholder="Search for the address"
              onChange={(location) => {
                setValues((prev) => ({ ...prev, address: location.address }));
                setCoords({ latitude: location.lat, longitude: location.lng });
              }}
            />
          ) : (
            <input
              className="input mt-2"
              value={values.address}
              placeholder="Street, city…"
              onChange={(event) => setValues({ ...values, address: event.target.value })}
            />
          )}
        </div>
        <label className="text-sm font-medium text-[#1B365F] sm:col-span-2">
          Education
          <textarea className="input mt-2 min-h-[70px]" value={values.education} onChange={(event) => setValues({ ...values, education: event.target.value })} />
        </label>
        {!member ? (
          <label className="text-sm font-medium text-[#1B365F] sm:col-span-2">
            Temporary password
            <input className="input mt-2" type="text" minLength={6} value={values.password} onChange={(event) => setValues({ ...values, password: event.target.value })} placeholder="At least 6 characters" required />
          </label>
        ) : null}
      </form>
    </Modal>
  );
}
