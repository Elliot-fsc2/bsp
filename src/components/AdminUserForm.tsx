"use client";

import { useActionState } from "react";
import { createUserAction } from "@/actions/admin";

export function AdminUserForm() {
  const [state, formAction, pending] = useActionState(createUserAction, { error: "", ok: false });
  return (
    <form action={formAction} className="space-y-3">
      <input className="bloom-input" name="name" placeholder="Full name" required />
      <input className="bloom-input" name="email" type="email" placeholder="email@bsp.org.ph" required />
      <select className="bloom-select" name="role" defaultValue="student">
        <option value="student">Scout</option>
        <option value="teacher">Scout Leader</option>
        <option value="admin">Council Admin</option>
      </select>
      <input className="bloom-input" name="password" placeholder="Password (default laginghanda)" />
      {state?.error ? <p className="text-sm font-bold text-[#c9184a]">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm font-bold text-[#2d6a4f]">Invited. They can log in now.</p> : null}
      <button className="bloom-btn" disabled={pending}>
        {pending ? "Inviting…" : "Create user"}
      </button>
    </form>
  );
}
