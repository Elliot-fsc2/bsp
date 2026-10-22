"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X } from "lucide-react";

export function PaymentReview({ paymentId }: { paymentId: number }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);

  async function run(action: "verify" | "reject") {
    setPending(true);
    await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId, action, adminNote: note }),
    });
    setPending(false);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        className="input"
        placeholder="Registrar note"
        value={note}
        onChange={(event) => setNote(event.target.value)}
      />
      <div className="flex gap-2">
        <button
          className="grid h-9 w-9 place-items-center rounded-full bg-[#1E4488] text-white transition hover:bg-[#1B365F] disabled:opacity-50"
          type="button"
          title="Verify & unlock"
          aria-label="Verify & unlock"
          disabled={pending}
          onClick={() => void run("verify")}
        >
          <Check size={16} />
        </button>
        <button
          className="grid h-9 w-9 place-items-center rounded-full bg-[#AC242A] text-white transition hover:bg-[#8f1d22] disabled:opacity-50"
          type="button"
          title="Reject"
          aria-label="Reject"
          disabled={pending}
          onClick={() => void run("reject")}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
