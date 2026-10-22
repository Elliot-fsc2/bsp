import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { BarChart3, ListFilter } from "lucide-react";
import { db } from "@/db";
import { examAttempts, levels, payments, users } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { CategoryChart, TrendChart, type ChartPoint } from "@/components/admin/ReportCharts";
import { ReportsTabs, type LevelRow, type SummaryRow } from "@/components/admin/ReportsTabs";
import { siteFees, type PaymentPurpose } from "@/lib/fees";
import { requireAdminPage } from "@/lib/guards";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

const REGISTRATION_STATUSES = ["verified", "pending", "rejected"];
const PURPOSE_OPTIONS = [
  { value: "registration", label: "Registration fee" },
  { value: "exam_retake", label: "Exam retake fee" },
  { value: "reinstatement", label: "Reinstatement fee" },
];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function GeneralReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdminPage();
  const params = await searchParams;
  const fromRaw = params.from ?? "";
  const toRaw = params.to ?? "";
  const purpose = params.purpose ?? "all";
  const from = fromRaw ? new Date(`${fromRaw}T00:00:00`) : null;
  const to = toRaw ? new Date(`${toRaw}T23:59:59.999`) : null;

  const allPayments = await db
    .select({ payment: payments, user: users })
    .from(payments)
    .innerJoin(users, eq(payments.userId, users.id))
    .orderBy(desc(payments.submittedAt));
  const allMembers = await db.select().from(users);
  const allAttempts = await db.select().from(examAttempts);
  const allLevels = await db.select().from(levels).orderBy(levels.number);

  const { registration, examRetake, reinstatement, currency } = await siteFees();

  const filteredPayments = allPayments.filter(({ payment }) => {
    if (purpose !== "all" && (payment.purpose ?? "registration") !== purpose) return false;
    if (from && payment.submittedAt < from) return false;
    if (to && payment.submittedAt > to) return false;
    return true;
  });

  const verifiedCount = (target: PaymentPurpose) =>
    filteredPayments.filter(({ payment }) => (payment.purpose ?? "registration") === target && payment.status === "verified").length;

  const buildRow = (title: string, qty: number, priceCents: number): SummaryRow => {
    const totalCents = qty * priceCents;
    const gppCents = Math.round(totalCents * 0.2);
    return { title, qty, priceCents, totalCents, gppCents, scodCents: totalCents - gppCents };
  };

  const summary: SummaryRow[] = [
    buildRow("Applicants", verifiedCount("registration"), registration),
    buildRow("Retake Applicants", verifiedCount("exam_retake"), examRetake),
    buildRow("Reinstatement", verifiedCount("reinstatement"), reinstatement),
  ];
  const summaryTotals: SummaryRow = summary.reduce<SummaryRow>(
    (acc, row) => ({
      title: "Total",
      qty: acc.qty + row.qty,
      priceCents: 0,
      totalCents: acc.totalCents + row.totalCents,
      gppCents: acc.gppCents + row.gppCents,
      scodCents: acc.scodCents + row.scodCents,
    }),
    { title: "Total", qty: 0, priceCents: 0, totalCents: 0, gppCents: 0, scodCents: 0 },
  );

  const registrationByStatus = REGISTRATION_STATUSES.map((status) => {
    const rows = filteredPayments.filter(({ payment }) => (payment.purpose ?? "registration") === "registration" && payment.status === status);
    return { status, qty: rows.length, amountCents: rows.reduce((sum, { payment }) => sum + payment.amountCents, 0) };
  });

  const retakeCount = verifiedCount("exam_retake");
  const retakeRevenueCents = retakeCount * examRetake;

  const retakesByLevel = new Map<number, number>();
  const groups = new Map<string, { levelId: number; count: number }>();
  for (const attempt of allAttempts) {
    const key = `${attempt.userId}:${attempt.levelId}`;
    const group = groups.get(key) ?? { levelId: attempt.levelId, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    retakesByLevel.set(group.levelId, (retakesByLevel.get(group.levelId) ?? 0) + Math.max(0, group.count - 1));
  }

  const statsByLevel = new Map<number, { attempts: number; passed: number; scoreSum: number; scoreCount: number }>();
  for (const attempt of allAttempts) {
    const stat = statsByLevel.get(attempt.levelId) ?? { attempts: 0, passed: 0, scoreSum: 0, scoreCount: 0 };
    stat.attempts += 1;
    if (attempt.passed) stat.passed += 1;
    if (typeof attempt.scorePercent === "number") {
      stat.scoreSum += attempt.scorePercent;
      stat.scoreCount += 1;
    }
    statsByLevel.set(attempt.levelId, stat);
  }

  const levelRows: LevelRow[] = allLevels.map((level) => {
    const stat = statsByLevel.get(level.id) ?? { attempts: 0, passed: 0, scoreSum: 0, scoreCount: 0 };
    return {
      number: level.number,
      name: level.name,
      attempts: stat.attempts,
      passed: stat.passed,
      notPassed: stat.attempts - stat.passed,
      retakes: retakesByLevel.get(level.id) ?? 0,
      avgScore: stat.scoreCount ? Math.round(stat.scoreSum / stat.scoreCount) : null,
    };
  });

  const totals = levelRows.reduce(
    (acc, row) => ({ attempts: acc.attempts + row.attempts, retakes: acc.retakes + row.retakes, passed: acc.passed + row.passed }),
    { attempts: 0, retakes: 0, passed: 0 },
  );

  const paymentRecords = filteredPayments.map(({ payment, user }) => ({
    id: payment.id,
    member: user.fullName,
    email: user.email,
    purpose: payment.purpose ?? "registration",
    reference: payment.referenceNumber,
    status: payment.status,
    amountCents: payment.amountCents,
    submittedAt: payment.submittedAt.toISOString(),
  }));

  // ---- Analytics ----
  const verifiedPayments = filteredPayments.filter(({ payment }) => payment.status === "verified");
  const verifiedRevenue = verifiedPayments.reduce((sum, { payment }) => sum + payment.amountCents, 0);
  const gppCents = Math.round(verifiedRevenue * 0.2);
  const scodCents = verifiedRevenue - gppCents;

  const inRange = (date: Date) => (!from || date >= from) && (!to || date <= to);
  const memberCount = allMembers.filter((user) => user.role === "student" && inRange(user.createdAt)).length;
  const scopedAttempts = allAttempts.filter((attempt) => inRange(attempt.startedAt));
  const passedAttempts = scopedAttempts.filter((attempt) => attempt.passed).length;
  const passRate = scopedAttempts.length ? Math.round((passedAttempts / scopedAttempts.length) * 100) : 0;

  const kpis = [
    { label: "Verified revenue", value: formatMoney(verifiedRevenue, currency), tone: "text-[#1B365F]" },
    { label: "GPP (20%)", value: formatMoney(gppCents, currency), tone: "text-[#AC242A]" },
    { label: "SCOD income", value: formatMoney(scodCents, currency), tone: "text-[#00694B]" },
    { label: "Members", value: String(memberCount), tone: "text-[#1B365F]" },
    { label: "Exam attempts", value: String(scopedAttempts.length), tone: "text-[#1B365F]" },
    { label: "Pass rate", value: `${passRate}%`, tone: "text-[#0076AF]" },
  ];

  const trendMap = new Map<string, number>();
  for (const { payment } of verifiedPayments) {
    const key = `${payment.submittedAt.getFullYear()}-${payment.submittedAt.getMonth()}`;
    trendMap.set(key, (trendMap.get(key) ?? 0) + payment.amountCents);
  }
  const now = new Date();
  const trend: ChartPoint[] = [];
  for (let i = 11; i >= 0; i -= 1) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trend.push({ label: MONTH_LABELS[month.getMonth()], cents: trendMap.get(`${month.getFullYear()}-${month.getMonth()}`) ?? 0 });
  }

  const categoryData: ChartPoint[] = [
    { label: "Registration", cents: verifiedPayments.filter(({ payment }) => (payment.purpose ?? "registration") === "registration").reduce((s, { payment }) => s + payment.amountCents, 0) },
    { label: "Exam retake", cents: verifiedPayments.filter(({ payment }) => payment.purpose === "exam_retake").reduce((s, { payment }) => s + payment.amountCents, 0) },
    { label: "Reinstatement", cents: verifiedPayments.filter(({ payment }) => payment.purpose === "reinstatement").reduce((s, { payment }) => s + payment.amountCents, 0) },
  ];

  return (
    <AppShell user={admin} nav={adminNav} title="General reports">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="relative overflow-hidden rounded-[28px] bg-[#1B365F] p-6 text-white sm:p-7">
          <span className="pointer-events-none absolute -bottom-16 right-6 hidden h-44 w-44 rounded-full border-[26px] border-white/10 sm:block" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#FFCF00]">System overview</p>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl">General System Reports</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                Comprehensive audit trail and filtered records of payment submissions, exam results, and member growth.
              </p>
            </div>
            <span className="hidden h-14 w-14 place-items-center rounded-2xl bg-[#FFCF00] text-[#1B365F] sm:grid"><BarChart3 size={26} /></span>
          </div>
          <div className="relative mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="font-serif text-2xl font-bold">{filteredPayments.length}</p>
              <p className="text-xs text-white/70">Payment records</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="font-serif text-2xl font-bold">{scopedAttempts.length}</p>
              <p className="text-xs text-white/70">Exam submissions</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <p className="font-serif text-2xl font-bold">{memberCount}</p>
              <p className="text-xs text-white/70">Members</p>
            </div>
          </div>
        </section>

        <form method="get" className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8F4FA] text-[#0076AF]"><ListFilter size={18} /></span>
            <div>
              <h2 className="font-serif text-xl text-[#1B365F]">Filters</h2>
              <p className="text-xs text-[#708099]">Restrict payments by date range and purpose.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-[#1B365F]">
              From
              <input className="input mt-1.5" name="from" type="date" defaultValue={fromRaw} />
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              To
              <input className="input mt-1.5" name="to" type="date" defaultValue={toRaw} />
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              Purpose
              <select className="input mt-1.5" name="purpose" defaultValue={purpose}>
                <option value="all">All purposes</option>
                {PURPOSE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="btn btn-dark" type="submit">Apply filters</button>
            <Link href="/admin/general-reports" className="btn btn-ghost">Clear</Link>
            <span className="text-sm text-[#708099]">{filteredPayments.length} payment{filteredPayments.length === 1 ? "" : "s"} in range</span>
          </div>
        </form>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-[22px] border border-[#dce5f1] bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#708099]">{kpi.label}</p>
              <p className={`mt-2 font-serif text-3xl ${kpi.tone}`}>{kpi.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="rounded-[28px] border border-[#dce5f1] bg-white p-6 shadow-sm">
            <h3 className="font-serif text-2xl text-[#1B365F]">Revenue trend</h3>
            <p className="mt-1 text-sm text-[#708099]">Verified revenue over the last 12 months.</p>
            <div className="mt-4">
              <TrendChart data={trend} currency={currency} />
            </div>
          </section>
          <section className="rounded-[28px] border border-[#dce5f1] bg-white p-6 shadow-sm">
            <h3 className="font-serif text-2xl text-[#1B365F]">Income by category</h3>
            <p className="mt-1 text-sm text-[#708099]">Verified revenue split by payment type.</p>
            <div className="mt-5">
              <CategoryChart data={categoryData} currency={currency} />
            </div>
          </section>
        </div>

        <ReportsTabs
          summary={summary}
          summaryTotals={summaryTotals}
          registrationByStatus={registrationByStatus}
          retakeRevenueCents={retakeRevenueCents}
          retakeCount={retakeCount}
          levels={levelRows}
          totals={totals}
          payments={paymentRecords}
          currency={currency}
        />
      </div>
    </AppShell>
  );
}
