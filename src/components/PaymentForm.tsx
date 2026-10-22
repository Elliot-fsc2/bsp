"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ReceiptText } from "lucide-react";

export function PaymentForm({ purpose, label, feeCents, currency = "USD" }: { purpose: string; label: string; feeCents: number; currency?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/payments", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setPending(false);
    if (!response.ok) {
      setError(data.error ?? "Could not submit payment.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 space-y-4">
      <div className="flex items-center gap-3 rounded-2xl border border-[#dce5f1] bg-[#F5F7FB] p-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1E4488] text-white">
          <ReceiptText size={19} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1B365F]">{label}</p>
          <p className="text-xs text-[#708099]">Payment type: {purpose.replaceAll("_", " ")}</p>
        </div>
      </div>
      <label className="block text-sm">
        Bank / transfer reference number
        <input className="input mt-2" name="referenceNumber" required />
      </label>
      <label className="block text-sm">
        Receipt (JPG, PNG, WEBP, or PDF)
        <input className="input mt-2" name="receipt" type="file" accept="image/*,.pdf" required />
      </label>
      <label className="block text-sm">
        Notes for the registrar
        <textarea className="input mt-2 min-h-[90px]" name="notes" />
      </label>
      {error ? <p className="text-sm text-[#AC242A]">{error}</p> : null}
      <button className="btn btn-dark w-full" disabled={pending} type="submit">
        {pending ? "Uploading…" : `Submit ${label.toLowerCase()} — ${new Intl.NumberFormat(undefined, { style: "currency", currency }).format(feeCents / 100)}`}
      </button>
    </form>
  );
}
