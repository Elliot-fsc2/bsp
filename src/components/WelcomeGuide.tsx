"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  ["1", "About DeMolay", "DeMolay is a youth leadership organization built on character, service, friendship, and respectful conduct. This pathway is a digital companion to your chapter experience."],
  ["2", "Your five-level pathway", "Read the published lessons at your own pace during the study window. Each level ends with one general examination. Meet the required score to unlock the next level."],
  ["3", "Exams & deadlines", "Your leadership council sets your study days, exam days, time limit, question shuffle, and number of attempts. Save your answers as you work; unfinished work submits when time ends."],
  ["4", "Conduct & honesty", "Approach your studies with honesty and courtesy. Sit each assessment on your own, keep your account secure, and contact the leadership council if you need help or an extension."],
  ["5", "Payment & support", "Registration fees are verified offline after you upload a receipt and transfer reference. You will receive an email when your payment is approved and Level 1 opens."],
];

export function WelcomeGuide({ name }: { name: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [pending, setPending] = useState(false);

  async function finish() {
    if (!checked) return;
    setPending(true);
    await fetch("/api/profile/guide", { method: "POST" });
    router.push("/dashboard/profile?changePassword=1");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="overflow-hidden rounded-[34px] bg-white shadow-[0_24px_70px_rgba(16,35,30,0.12)]">
        <div className="grid bg-[#1E4488] lg:grid-cols-[0.95fr_1.05fr]">
          <img src="/images/community.jpg" alt="DeMolay members collaborating" className="h-full min-h-[300px] w-full object-cover" />
          <div className="p-8 text-white md:p-12">
            <p className="text-xs uppercase tracking-[0.22em] text-[#FFCF00]">New member guide</p>
            <h1 className="mt-3 font-serif text-5xl leading-[1.06]">Welcome, {name.split(" ")[0]}.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/80">Before you enter the DeMolay Leadership Pathway, take a few minutes to understand how your studies, examinations, payment verification, and support work together.</p>
          </div>
        </div>
        <div className="p-7 md:p-10">
          <div className="grid gap-4 md:grid-cols-2">
            {STEPS.map(([number, title, copy]) => (
              <article key={number} className="rounded-3xl bg-[#F5F7FB] p-5">
                <span className="inline-grid h-8 w-8 place-items-center rounded-full bg-[#1E4488] text-sm font-bold text-white">{number}</span>
                <h2 className="mt-4 font-serif text-2xl text-[#1B365F]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#52657A]">{copy}</p>
              </article>
            ))}
          </div>
          <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#1B365F]/15 p-4 text-sm leading-6">
            <input className="mt-1" type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
            <span>I have read the DeMolay Leadership Pathway guide and agree to use the learning platform with courtesy, honesty, and respect.</span>
          </label>
          <button className="btn btn-dark mt-5" type="button" disabled={!checked || pending} onClick={() => void finish()}>
            {pending ? "Opening your settings…" : "Continue to Profile & Security"}
          </button>
        </div>
      </div>
    </div>
  );
}
