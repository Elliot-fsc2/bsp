"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction } from "@/actions/auth";

const demos = [
  { label: "Council Admin", email: "admin@bsp.org.ph", note: "Ramon · council office" },
  { label: "Scout Leader", email: "miguel@bsp.org.ph", note: "Miguel · outdoor skills" },
  { label: "Scout", email: "paolo@bsp.org.ph", note: "Paolo · badge trail" },
];

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(loginAction, { error: "" });

  return (
    <form action={action} className="space-y-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">Email</span>
        <input className="bloom-input" name="email" type="email" placeholder="you@bsp.org.ph" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">Password</span>
        <input className="bloom-input" name="password" type="password" placeholder="••••••••" required />
      </label>
      {state?.error ? (
        <p className="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{state.error}</p>
      ) : null}
      <button className="bloom-btn w-full" disabled={pending}>
        {pending ? "Raising the flag…" : "Enter portal"}
      </button>
      <p className="text-center text-sm font-bold text-[var(--muted)]">
        New here?{" "}
        <Link href="/register" className="text-[var(--secondary)]">
          Create an account
        </Link>
      </p>
      <div className="grid gap-2">
        <p className="text-center text-xs font-extrabold tracking-wide text-[var(--muted)] uppercase">
          Demo accounts · password laginghanda
        </p>
        {demos.map((demo) => (
          <button
            key={demo.email}
            type="button"
            className="chip w-full justify-between bg-white"
            onClick={(event) => {
              const form = (event.currentTarget as HTMLButtonElement).closest("form");
              if (!form) return;
              const email = form.querySelector('input[name="email"]') as HTMLInputElement | null;
              const password = form.querySelector('input[name="password"]') as HTMLInputElement | null;
              if (email) email.value = demo.email;
              if (password) password.value = "laginghanda";
            }}
          >
            <span>{demo.label}</span>
            <span className="text-[var(--muted)]">{demo.note}</span>
          </button>
        ))}
      </div>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, { error: "" });
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">Name</span>
        <input className="bloom-input" name="name" placeholder="Your name" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">Email</span>
        <input className="bloom-input" name="email" type="email" placeholder="you@bsp.org.ph" required />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-extrabold">Password</span>
        <input className="bloom-input" name="password" type="password" minLength={6} required />
      </label>
      {state?.error ? (
        <p className="rounded-2xl bg-[#ffe0e8] px-3 py-2 text-sm font-bold">{state.error}</p>
      ) : null}
      <button className="bloom-btn w-full" disabled={pending}>
        {pending ? "Signing up…" : "Create my account"}
      </button>
      <p className="text-center text-sm font-bold text-[var(--muted)]">
        Already a member?{" "}
        <Link href="/login" className="text-[var(--secondary)]">
          Log in
        </Link>
      </p>
    </form>
  );
}
