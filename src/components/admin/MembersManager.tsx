"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Eye, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Avatar } from "@/components/social/Avatar";
import { StatusChip } from "@/components/StatusChip";
import { MemberFormModal, Modal, type EditableMember } from "@/components/admin/MemberForm";
import { FacebookButton, isFacebookUrl } from "@/components/FacebookButton";
import { MapViewButton } from "@/components/MapViewButton";
import { formatDate } from "@/lib/utils";
import { mapRegistrationFields, memberDetailRows, readRegistrationValue, type RegistrationFieldMap, type RegistrationFormContent } from "@/lib/registration-form";
import { ACCOUNT_STATUS_LABELS } from "@/lib/types";

export type MemberRow = EditableMember & {
  createdAt: string;
  profileBio: string | null;
  professionalHeadline: string | null;
  resumeSummary: string | null;
  skills: string | null;
  experience: string | null;
  birthDate: string | null;
  profilePhoto: string | null;
  registrationDetails: string | null;
  age: number | null;
  levelLabel: string;
  passedCount: number;
};

function memberDisplayName(member: MemberRow, fieldMap: RegistrationFieldMap): string {
  const last = readRegistrationValue(member, fieldMap.lastName) || member.fullName;
  const given = readRegistrationValue(member, fieldMap.givenName);
  if (!given) return last;
  const tokens = given.toLowerCase().split(/\s+/).filter(Boolean);
  const alreadyIncluded = tokens.length > 0 && tokens.every((token) => last.toLowerCase().includes(token));
  return alreadyIncluded ? last : `${given} ${last}`;
}

async function post(body: Record<string, unknown>) {
  const response = await fetch("/api/admin/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string; id?: number; registrationDetails?: string };
  return { ok: response.ok, data };
}

export function MembersManager({ members, form, googleMapsApiKey }: { members: MemberRow[]; form: RegistrationFormContent; googleMapsApiKey: string }) {
  const router = useRouter();
  const fieldMap = mapRegistrationFields(form);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const viewing = members.find((member) => member.id === viewingId) ?? null;
  const editing = members.find((member) => member.id === editingId) ?? null;
  const allSelected = members.length > 0 && selected.size === members.length;

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(members.map((member) => member.id)));
  }

  async function remove(ids: number[]) {
    setError("");
    setBusy(true);
    const { ok, data } = await post({ action: "delete", ids });
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Could not delete.");
      return;
    }
    if (viewingId !== null && ids.includes(viewingId)) setViewingId(null);
    setSelected(new Set());
    router.refresh();
  }

  function deleteOne(member: MemberRow) {
    if (!confirm(`Delete ${member.fullName} and all related records?`)) return;
    void remove([member.id]);
  }

  function deleteSelected() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} member${ids.length === 1 ? "" : "s"} and all related records?`)) return;
    void remove(ids);
  }

  return (
    <section className="rounded-[26px] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-dark" onClick={() => setAdding(true)}>
          <Plus size={16} /> Add member
        </button>
        {selected.size > 0 ? (
          <button type="button" className="btn btn-danger" disabled={busy} onClick={deleteSelected}>
            <Trash2 size={16} /> Delete selected ({selected.size})
          </button>
        ) : null}
        <span className="ml-auto text-sm text-[#708099]">
          {selected.size > 0 ? `${selected.size} selected` : `${members.length} member${members.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {error ? <p className="mb-3 rounded-xl bg-[#FFF1F0] px-4 py-2.5 text-sm text-[#AC242A]">{error}</p> : null}

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th className="w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all members" />
              </th>
              <th>Member</th>
              <th>Age</th>
              <th>Status</th>
              <th>Chapter</th>
              <th>Membership</th>
              <th>LMS level</th>
              <th>Joined</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(member.id)}
                    onChange={() => toggle(member.id)}
                    aria-label={`Select ${member.fullName}`}
                  />
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <Avatar id={member.id} name={memberDisplayName(member, fieldMap)} size="sm" />
                    <div>
                      <p className="font-semibold text-[#1B365F]">{memberDisplayName(member, fieldMap)}</p>
                      <p className="text-xs text-[#708099]">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="text-sm text-[#52657A]">{member.age ?? "—"}</td>
                <td><StatusChip status={member.accountStatus} /></td>
                <td className="text-xs text-[#52657A]">{readRegistrationValue(member, fieldMap.chapter) || "—"}</td>
                <td className="text-xs text-[#52657A]">{readRegistrationValue(member, fieldMap.membershipStatus) || "—"}</td>
                <td className="text-xs text-[#52657A]">
                  <p className="font-semibold text-[#1E4488]">{member.levelLabel}</p>
                  <p className="text-[#708099]">{member.passedCount}/5 passed</p>
                </td>
                <td className="text-xs text-[#708099]">{formatDate(member.createdAt)}</td>
                <td>
                  <div className="flex items-center justify-end gap-1.5">
                    <button type="button" className="rounded-lg p-2 text-[#0076AF] hover:bg-[#F3F6FA]" title="View" onClick={() => setViewingId(member.id)}>
                      <Eye size={16} />
                    </button>
                    <button type="button" className="rounded-lg p-2 text-[#1E4488] hover:bg-[#F3F6FA]" title="Edit" onClick={() => setEditingId(member.id)}>
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="rounded-lg p-2 text-[#AC242A] hover:bg-[#F3F6FA]" title="Delete" onClick={() => deleteOne(member)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!members.length ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-sm text-[#708099]">No members match those filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {viewing ? (
        <MemberViewModal
          member={viewing}
          form={form}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            setEditingId(viewing.id);
            setViewingId(null);
          }}
        />
      ) : null}

      {editing || adding ? (
        <MemberFormModal
          member={editing}
          form={form}
          apiKey={googleMapsApiKey}
          onClose={() => {
            setEditingId(null);
            setAdding(false);
          }}
          onSaved={() => {
            setEditingId(null);
            setAdding(false);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="rounded-2xl bg-[#F7F9FD] p-3">
      <p className="text-xs uppercase tracking-[0.12em] text-[#718096]">{label}</p>
      {isUrl(value) ? (
        isFacebookUrl(value) ? (
          <FacebookButton url={value} />
        ) : (
          <a
            href={value}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all text-sm font-semibold text-[#0076AF] hover:underline"
          >
            {value}
          </a>
        )
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-[#1B365F]">{value}</p>
      )}
    </div>
  );
}

function MemberViewModal({ member, form, onClose, onEdit }: { member: MemberRow; form: RegistrationFormContent; onClose: () => void; onEdit: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const rows = memberDetailRows(member, form);

  async function sync() {
    setBusy(true);
    setNotice("");
    const { ok, data } = await post({ action: "sync-profile", id: member.id });
    setBusy(false);
    if (!ok) {
      setNotice(data.error ?? "Could not sync the profile.");
      return;
    }
    setNotice("Profile updated from registration.");
    router.refresh();
  }

  return (
    <Modal
      title={member.fullName}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-dark" disabled={busy} onClick={sync}>
            <RefreshCw size={16} /> {busy ? "Updating…" : "Update profile from registration"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onEdit}>
            <Pencil size={16} /> Edit
          </button>
          {notice ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-[#00694B]">
              <CheckCircle2 size={16} /> {notice}
            </span>
          ) : null}
        </>
      }
    >
      <div className="flex items-center gap-4">
        <Avatar id={member.id} name={member.fullName} size="md" />
        <div>
          <p className="font-semibold text-[#1B365F]">{member.fullName}</p>
          <p className="text-sm text-[#708099]">{member.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <StatusChip status={member.accountStatus} />
            <span className="text-xs text-[#708099]">Joined {formatDate(member.createdAt)}</span>
          </div>
        </div>
      </div>

      <h3 className="mt-6 font-serif text-xl text-[#1B365F]">Registration details</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <Detail key={row.label} label={row.label} value={row.value} />
        ))}
        <Detail label="Account status" value={ACCOUNT_STATUS_LABELS[member.accountStatus as keyof typeof ACCOUNT_STATUS_LABELS] ?? member.accountStatus} />
        {!rows.length ? <p className="text-sm text-[#708099]">No registration details captured.</p> : null}
      </div>
      <MapViewButton latitude={member.latitude} longitude={member.longitude} address={member.address} />

      <h3 className="mt-6 font-serif text-xl text-[#1B365F]">Profile</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <Detail label="Headline" value={member.professionalHeadline} />
        <Detail label="Birth date" value={member.birthDate} />
        <Detail label="Bio" value={member.profileBio} />
        <Detail label="Professional summary" value={member.resumeSummary} />
        <Detail label="Skills" value={member.skills} />
        <Detail label="Experience" value={member.experience} />
        <Detail label="Synced registration details" value={member.registrationDetails} />
      </div>
    </Modal>
  );
}
