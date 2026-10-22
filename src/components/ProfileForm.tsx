"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/auth";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { AuthUser } from "@/lib/types";

const colors = ["#2d6a4f", "#40916c", "#52b788", "#74c69d", "#95d5b2", "#c9a227", "#bc6c25", "#6b705c"];

export function ProfileForm({ user }: { user: AuthUser }) {
  const [state, action, pending] = useActionState(updateProfileAction, { error: "", ok: false });
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">Name</span>
        <input className="bloom-input" name="name" defaultValue={user.name} required />
      </label>
      <div>
        <span className="mb-1 block text-sm font-extrabold">Bio</span>
        <RichTextEditor name="bio" defaultValue={user.bio ?? ""} minHeight={140} placeholder="A sentence or three about you." />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-extrabold">Avatar color</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <label key={color} className="cursor-pointer">
              <input className="sr-only" type="radio" name="avatarColor" value={color} defaultChecked={user.avatarColor === color} />
              <span
                className="block h-9 w-9 rounded-full border-4 border-white shadow-[3px_3px_0_rgba(43,27,78,0.12)]"
                style={{ background: color }}
              />
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">New password (optional)</span>
        <input className="bloom-input" name="password" type="password" placeholder="Leave blank to keep it" />
      </label>
      {state?.error ? <p className="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{state.error}</p> : null}
      {state?.ok ? <p className="rounded-2xl bg-[#d8f3dc] px-3 py-2 text-sm font-bold">Saved. Looking sharp, Scout.</p> : null}
      <button className="bloom-btn" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
