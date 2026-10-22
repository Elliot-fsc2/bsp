import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { Avatar } from "@/components/social/Avatar";
import { PaymentReview } from "@/components/admin/PaymentReview";
import { ReceiptPreview } from "@/components/admin/ReceiptPreview";
import { StatusChip } from "@/components/StatusChip";
import { PURPOSE_LABELS, siteFees } from "@/lib/fees";
import { requireAdminPage } from "@/lib/guards";
import { formatDateTime, formatMoney, normalizeText } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PURPOSES = ["registration", "exam_retake", "reinstatement"] as const;

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdminPage();
  const params = await searchParams;
  const { currency } = await siteFees();
  const q = normalizeText(params.q ?? "");
  const status = params.status ?? "all";
  const purpose = params.purpose ?? "all";
  const sort = params.sort ?? "newest";

  const allRows = await db
    .select({ payment: payments, user: users })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .orderBy(desc(payments.submittedAt));

  const rows = allRows
    .filter(({ payment, user }) => {
      if (status !== "all" && payment.status !== status) return false;
      if (purpose !== "all" && (payment.purpose ?? "registration") !== purpose) return false;
      if (q) {
        const haystack = normalizeText(`${user.fullName} ${user.email} ${payment.referenceNumber}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sort === "amount") return b.payment.amountCents - a.payment.amountCents;
      if (sort === "name") return a.user.fullName.localeCompare(b.user.fullName);
      return b.payment.submittedAt.getTime() - a.payment.submittedAt.getTime();
    });

  const pendingCount = allRows.filter((row) => row.payment.status === "pending").length;

  return (
    <AppShell user={admin} nav={adminNav} title="Payments">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[26px] bg-[#1B365F] p-6 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-[#FFCF00]">Payment desk</p>
          <h2 className="mt-1 font-serif text-2xl">{pendingCount} awaiting review</h2>
        </section>

        <form method="get" className="rounded-[24px] bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="text-sm font-medium text-[#1B365F] lg:col-span-2">
              Search member or reference
              <input className="input mt-1.5" name="q" defaultValue={params.q ?? ""} placeholder="Name, email, or ref number…" />
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              Status
              <select className="input mt-1.5" name="status" defaultValue={status}>
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              Purpose
              <select className="input mt-1.5" name="purpose" defaultValue={purpose}>
                <option value="all">All purposes</option>
                {PURPOSES.map((key) => (
                  <option key={key} value={key}>{PURPOSE_LABELS[key] ?? key.replaceAll("_", " ")}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              Sort
              <select className="input mt-1.5" name="sort" defaultValue={sort}>
                <option value="newest">Newest first</option>
                <option value="amount">Amount (high first)</option>
                <option value="name">Member A–Z</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button className="btn btn-dark" type="submit">Apply filters</button>
            <Link href="/admin/payments" className="btn btn-ghost">Clear</Link>
            <span className="ml-auto text-sm text-[#708099]">{rows.length} payment{rows.length === 1 ? "" : "s"}</span>
          </div>
        </form>

        <section className="rounded-[26px] bg-white p-5 shadow-sm">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Purpose</th>
                  <th>Reference</th>
                  <th>Amount</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Receipt</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ payment, user }) => (
                  <tr key={payment.id} className="align-top">
                    <td>
                      <Link href={`/admin/applicants/${user.id}`} className="flex items-center gap-3 hover:underline">
                        <Avatar id={user.id} name={user.fullName} size="sm" />
                        <div>
                          <p className="font-semibold text-[#1B365F]">{user.fullName}</p>
                          <p className="text-xs text-[#708099]">{user.email}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="text-xs font-semibold uppercase tracking-[0.08em] text-[#0076AF]">
                      {PURPOSE_LABELS[(payment.purpose ?? "registration") as keyof typeof PURPOSE_LABELS] ?? "Registration fee"}
                    </td>
                    <td className="text-xs text-[#52657A]">{payment.referenceNumber}</td>
                    <td className="text-sm font-semibold text-[#1B365F]">{formatMoney(payment.amountCents, currency)}</td>
                    <td className="text-xs text-[#708099]">{formatDateTime(payment.submittedAt)}</td>
                    <td><StatusChip status={payment.status} /></td>
                    <td>
                      <ReceiptPreview path={payment.receiptPath} label={`Receipt · ${user.fullName}`} />
                    </td>
                    <td className="min-w-[180px]">
                      {payment.status === "pending" ? (
                        <PaymentReview paymentId={payment.id} />
                      ) : payment.adminNote ? (
                        <p className="text-xs text-[#64758A]">{payment.adminNote}</p>
                      ) : payment.notes ? (
                        <p className="text-xs text-[#64758A]">{payment.notes}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-sm text-[#708099]">No payments match those filters.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}