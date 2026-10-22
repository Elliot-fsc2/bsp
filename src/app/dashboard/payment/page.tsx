import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { CircleCheck, Clock3, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { AppShell, studentNav } from "@/components/AppShell";
import { PaymentForm } from "@/components/PaymentForm";
import { StatusChip } from "@/components/StatusChip";
import { PURPOSE_LABELS, siteFees, studentPaymentState } from "@/lib/fees";
import { requireStudentPage } from "@/lib/guards";
import { formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PaymentPage() {
  const user = await requireStudentPage({ allowBeforeGuide: true });
  const state = await studentPaymentState(user.id);
  const history = await db
    .select()
    .from(payments)
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.submittedAt));
  const { currency } = await siteFees();

  const accent =
    state.reason === "reinstatement"
      ? { bg: "bg-[#AC242A]", icon: ShieldAlert }
      : state.reason === "retake"
        ? { bg: "bg-[#1E4488]", icon: Sparkles }
        : { bg: "bg-[#1B365F]", icon: Wallet };
  const AccentIcon = accent.icon;

  return (
    <AppShell user={user} nav={studentNav} title="Payment desk">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[28px] bg-white shadow-sm">
          <div className={`${accent.bg} relative p-6 text-white`}>
            <span className="pointer-events-none absolute -bottom-14 right-4 h-36 w-36 rounded-full border-[22px] border-white/10" />
            <div className="relative flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#FFCF00] text-[#1B365F]">
                <AccentIcon size={22} />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFCF00]">Offline verification</p>
                <h2 className="mt-1 font-serif text-3xl">
                  {state.reason === "ok" ? "You are all set" : state.label}
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  {state.reason === "registration" &&
                    "Pay the registration fee, then upload your receipt and reference number. The council verifies it before Level 1 opens."}
                  {state.reason === "retake" &&
                    "Your first exam attempt is included with registration. Settle the retake fee to unlock your second attempt."}
                  {state.reason === "reinstatement" &&
                    "Your second attempt was unsuccessful, so platform access is paused. Settle the reinstatement fee to continue your pathway."}
                  {state.reason === "waiting_verification" &&
                    "Your receipt is with the leadership council. You will receive an email as soon as it is verified."}
                  {state.reason === "ok" && "No payment is due right now. Your pathway is open."}
                </p>
                {state.reason !== "ok" && state.reason !== "waiting_verification" ? (
                  <p className="mt-4 font-serif text-4xl text-[#FFCF00]">{formatMoney(state.feeCents, currency)}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="p-6">
            {state.reason === "waiting_verification" ? (
              <div className="flex items-start gap-3 rounded-2xl bg-[#FFF7D1] p-4 text-sm text-[#705100]">
                <Clock3 size={18} className="mt-0.5 shrink-0" />
                <p>Waiting on the council to verify your {state.label.toLowerCase()}. You will get an email when it clears.</p>
              </div>
            ) : state.reason === "ok" ? (
              <div className="flex items-start gap-3 rounded-2xl bg-[#E9F5EA] p-4 text-sm text-[#00694B]">
                <CircleCheck size={18} className="mt-0.5 shrink-0" />
                <p>Your account is in good standing. Head back to your lessons or exam when you are ready.</p>
              </div>
            ) : (
              <PaymentForm purpose={state.reason} label={state.label} feeCents={state.feeCents} currency={currency} />
            )}
            <div className="mt-5 rounded-2xl bg-[#F5F7FB] p-4 text-xs leading-5 text-[#52657A]">
              Payments are handled offline. Transfer using your local council instructions, then upload a
              clear photo or PDF of the receipt with the bank reference number.
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-6 shadow-sm">
          <h3 className="font-serif text-2xl text-[#1B365F]">Payment history</h3>
          <ul className="mt-4 space-y-3">
            {history.map((payment) => (
              <li key={payment.id} className="rounded-2xl bg-[#F5F7FB] p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-[#1B365F]">{formatMoney(payment.amountCents, currency)}</span>
                  <StatusChip status={payment.status} />
                </div>
                <p className="mt-1 text-xs text-[#708099]">
                  {PURPOSE_LABELS[(payment.purpose ?? "registration") as keyof typeof PURPOSE_LABELS] ?? "Registration fee"} ·{" "}
                  {payment.referenceNumber}
                </p>
                <p className="text-xs text-[#708099]">{formatDateTime(payment.submittedAt)}</p>
                <a className="mt-2 inline-block text-xs font-semibold text-[#1E4488]" href={payment.receiptPath} target="_blank" rel="noreferrer">
                  View receipt
                </a>
                {payment.adminNote ? <p className="mt-2 text-xs text-[#AC242A]">{payment.adminNote}</p> : null}
              </li>
            ))}
            {!history.length ? <li className="text-sm text-[#708099]">No receipts uploaded yet.</li> : null}
          </ul>
          <Link href="/dashboard" className="mt-5 inline-block text-sm font-semibold text-[#1E4488]">
            ← Back to overview
          </Link>
        </section>
      </div>
    </AppShell>
  );
}
