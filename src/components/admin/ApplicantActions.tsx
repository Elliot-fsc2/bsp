"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Pencil } from "lucide-react";
import { MemberFormModal, type EditableMember } from "@/components/admin/MemberForm";
import type { RegistrationFormContent } from "@/lib/registration-form";

export function ApplicantActions({ member, form, googleMapsApiKey }: { member: EditableMember; form: RegistrationFormContent; googleMapsApiKey: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/admin/applicants/${member.id}`}
        title="Open file"
        aria-label={`Open ${member.fullName}`}
        className="rounded-lg p-2 text-[#0076AF] hover:bg-[#F3F6FA]"
      >
        <Eye size={16} />
      </Link>
      <button
        type="button"
        title="Edit"
        aria-label={`Edit ${member.fullName}`}
        className="rounded-lg p-2 text-[#1E4488] hover:bg-[#F3F6FA]"
        onClick={() => setEditing(true)}
      >
        <Pencil size={16} />
      </button>

      {editing ? (
        <MemberFormModal
          member={member}
          form={form}
          apiKey={googleMapsApiKey}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
