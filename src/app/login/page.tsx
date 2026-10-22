"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lock, Mail } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";
import { IconField } from "@/components/social/IconField";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [remember, setRemember] = useState(true);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        remember,
      }),
    });
    const data = (await response.json()) as {
      error?: string;
      role?: string;
      accountStatus?: string;
      guideCompleted?: boolean;
      passwordChanged?: boolean;
    };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to sign in.");
      return;
    }
    if (data.role === "admin") router.push("/admin");
    else if (!data.guideCompleted) router.push("/about-demolay?welcome=1");
    else if (!data.passwordChanged) router.push("/dashboard/profile?changePassword=1");
    else if (data.accountStatus === "pending_payment") router.push("/dashboard/payment");
    else router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-[#1B365F] lg:block">
        <img src="/images/hero.jpg" alt="DeMolay members" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-[#1B365F]/85" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandMark light />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FFCF00]">Welcome back, brother</p>
            <h1 className="mt-4 max-w-md font-serif text-4xl leading-tight text-white">
              Character. Leadership. Brotherhood. Service.
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
              Sign in to continue your pathway, keep up with your study plan, and keep building the habits of a
              leader.
            </p>
          </div>
          <div className="flex -space-x-3">
            {[0, 1, 2, 3].map((n) => (
              <span
                key={n}
                className="h-11 w-11 rounded-full border-2 border-[#1B365F] bg-[#FFCF00]"
              />
            ))}
            <span className="ml-2 self-center text-xs font-medium text-white/70">Members climbing together</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <BrandMark />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a93a6]">Sign in</p>
          <h1 className="mt-2 font-serif text-4xl text-[#1B365F]">Good to see you</h1>
          <p className="mt-2 text-sm text-[#6b7280]">Use your member email and password to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <IconField icon={Mail} name="email" type="email" placeholder="Email address" required />
            <IconField icon={Lock} name="password" placeholder="Password" isPassword required />

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-[#4b5563]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-[#d1d5db] text-[#1E4488] focus:ring-[#1E4488]"
                />
                Keep me signed in
              </label>
              <span className="text-[#9aa2b1]">Forgot it? Ask your council</span>
            </div>

            {error ? <p className="rounded-xl bg-[#FFF1F0] px-4 py-2.5 text-sm text-[#AC242A]">{error}</p> : null}

            <button
              className="flex w-full items-center justify-center rounded-full bg-[#1E4488] py-3.5 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(30,68,136,0.35)] transition hover:bg-[#1B365F] disabled:opacity-60"
              disabled={pending}
              type="submit"
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            New DeMolay applicant?{" "}
            <Link href="/register" className="font-semibold text-[#1E4488]">
              Create an account
            </Link>
          </p>

          <div className="mt-8 rounded-2xl bg-[#F4F7FB] p-4 text-xs leading-5 text-[#6b7280]">
            <p className="font-semibold text-[#1B365F]">Try the demo</p>
            <p className="mt-1">Council: council@demolaypathway.org / Admin123!</p>
            <p>Member: member@demolaypathway.org / Member123!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
