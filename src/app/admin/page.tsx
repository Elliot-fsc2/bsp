import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, levelProgress, levels, payments, users } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { StatusChip } from "@/components/StatusChip";
import { requireAdminPage } from "@/lib/guards";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const admin = await requireAdminPage();
  const applicants = await db
    .select()
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(desc(users.createdAt));
  const pendingPay = applicants.filter((user) => user.accountStatus === "pending_payment").length;
  const pendingVerify = applicants.filter((user) => user.accountStatus === "pending_verification").length;
  const active = applicants.filter((user) => user.accountStatus === "active").length;
  const paymentQueue = await db.select().from(payments).where(eq(payments.status, "pending"));
  const recentAttempts = await db
    .select({ attempt: examAttempts, user: users })
    .from(examAttempts)
    .innerJoin(users, eq(examAttempts.userId, users.id))
    .orderBy(desc(examAttempts.startedAt))
    .limit(8);
  const byLevel = await db
    .select({
      number: levels.number,
      name: levels.name,
      unlocked: sql<number>`cast(coalesce(sum(case when ${levelProgress.status} in ('unlocked', 'in_progress') then 1 else 0 end), 0) as unsigned)`,
      passed: sql<number>`cast(coalesce(sum(case when ${levelProgress.status} = 'passed' then 1 else 0 end), 0) as unsigned)`,
    })
    .from(levels)
    .leftJoin(levelProgress, eq(levelProgress.levelId, levels.id))
    .groupBy(levels.id)
    .orderBy(levels.number);

  return (
    <AppShell user={admin} nav={adminNav} title="Monitoring">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Applicants", String(applicants.length)],
          ["Awaiting payment", String(pendingPay)],
          ["Receipts to verify", String(pendingVerify || paymentQueue.length)],
          ["Active climbers", String(active)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[24px] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[#718096]">{label}</p>
            <p className="mt-2 font-serif text-4xl">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Level occupancy</h2>
            <Link href="/admin/applicants" className="text-sm text-[#0076AF]">
              All applicants
            </Link>
          </div>
          <div className="table-wrap mt-4">
            <table className="data">
              <thead>
                <tr>
                  <th>Level</th>
                  <th>Studying</th>
                  <th>Passed</th>
                </tr>
              </thead>
              <tbody>
                {byLevel.map((row) => (
                  <tr key={row.number}>
                    <td>
                      {row.number}. {row.name}
                    </td>
                    <td>{Number(row.unlocked)}</td>
                    <td>{Number(row.passed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl">Latest sittings</h2>
            <Link href="/admin/payments" className="text-sm text-[#0076AF]">
              Payment queue
            </Link>
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            {recentAttempts.map(({ attempt, user }) => (
              <li key={attempt.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F7F9FD] px-4 py-3">
                <span>
                  {user.fullName} · {attempt.scorePercent ?? "—"}%
                </span>
                <span className="flex items-center gap-2">
                  <StatusChip status={attempt.status} />
                  <span className="text-[#718096]">{formatDateTime(attempt.startedAt)}</span>
                </span>
              </li>
            ))}
            {!recentAttempts.length ? <li className="text-[#718096]">No exam activity yet.</li> : null}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-[28px] bg-white p-6">
        <h2 className="font-serif text-2xl">Newest applicants</h2>
        <div className="table-wrap mt-4">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Applied</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {applicants.slice(0, 8).map((user) => (
                <tr key={user.id}>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>
                    <StatusChip status={user.accountStatus} />
                  </td>
                  <td>{formatDateTime(user.createdAt)}</td>
                  <td>
                    <Link className="text-[#0076AF]" href={`/admin/applicants/${user.id}`}>
                      Track
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
