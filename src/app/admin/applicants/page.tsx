import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { examAttempts, levelProgress, levels, payments, settings, users } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { ApplicantActions } from "@/components/admin/ApplicantActions";
import { Avatar } from "@/components/social/Avatar";
import { StatusChip } from "@/components/StatusChip";
import { PURPOSE_LABELS } from "@/lib/fees";
import { requireAdminPage } from "@/lib/guards";
import { mapRegistrationFields, normalizeRegistrationForm, parseAnswers, readRegistrationValue } from "@/lib/registration-form";
import { formatDate, normalizeText } from "@/lib/utils";

export const dynamic = "force-dynamic";

const FILTERS = ["all", "pending_payment", "pending_verification", "active", "suspended", "rejected"] as const;

export default async function ApplicantsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdminPage();
  const params = await searchParams;
  const filter = (FILTERS as readonly string[]).includes(params.status ?? "all") ? params.status ?? "all" : "all";
  const q = normalizeText(params.q ?? "");
  const joinedFrom = params.joinedFrom ?? "";
  const joinedTo = params.joinedTo ?? "";
  const from = joinedFrom ? new Date(`${joinedFrom}T00:00:00`) : null;
  const to = joinedTo ? new Date(`${joinedTo}T23:59:59.999`) : null;

  const applicants = await db
    .select()
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(desc(users.createdAt));

  const allPayments = await db.select().from(payments).orderBy(desc(payments.submittedAt));
  const allProgress = await db.select().from(levelProgress);
  const allLevels = await db.select().from(levels).orderBy(levels.number);
  const allAttempts = await db
    .select({ id: examAttempts.id, userId: examAttempts.userId, levelId: examAttempts.levelId, score: examAttempts.scorePercent, status: examAttempts.status })
    .from(examAttempts);

  const levelById = new Map(allLevels.map((level) => [level.id, level]));
  const rows = applicants
    .filter((applicant) => {
      if (filter !== "all" && applicant.accountStatus !== filter) return false;
      if (q && !normalizeText(`${applicant.fullName} ${applicant.email}`).includes(q)) return false;
      if (from && applicant.createdAt < from) return false;
      if (to && applicant.createdAt > to) return false;
      return true;
    })
    .map((applicant) => {
      const payment = allPayments.find((item) => item.userId === applicant.id);
      const progress = allProgress.filter((item) => item.userId === applicant.id);
      const passed = progress.filter((item) => item.status === "passed").length;
      const open =
        progress.find((item) => item.status === "unlocked" || item.status === "in_progress") ??
        progress.find((item) => item.status !== "passed");
      const attempts = allAttempts.filter((item) => item.userId === applicant.id);
      const best = attempts.reduce((max, item) => Math.max(max, item.score ?? 0), open?.bestScore ?? 0);
      return {
        applicant,
        payment,
        open,
        openLevel: open ? levelById.get(open.levelId) : undefined,
        passedCount: passed,
        attempts: attempts.length,
        best,
      };
    });

  const counts = {
    all: applicants.length,
    pending_payment: applicants.filter((item) => item.accountStatus === "pending_payment").length,
    pending_verification: applicants.filter((item) => item.accountStatus === "pending_verification").length,
    active: applicants.filter((item) => item.accountStatus === "active").length,
    suspended: applicants.filter((item) => item.accountStatus === "suspended").length,
    rejected: applicants.filter((item) => item.accountStatus === "rejected").length,
  };

  const onboarding = applicants.filter((item) => item.guideCompletedAt && item.passwordChangedAt).length;

  const academy = (await db.select().from(settings).limit(1))[0];
  const form = normalizeRegistrationForm(academy?.registrationForm);
  const fieldMap = mapRegistrationFields(form);
  const googleMapsApiKey = academy?.googleMapsApiKey?.trim() ?? "";

  return (
    <AppShell user={admin} nav={adminNav} title="Applicant status">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {FILTERS.map((key) => {
            const active = filter === key;
            const labels: Record<string, string> = {
              all: "All applicants",
              pending_payment: "Awaiting payment",
              pending_verification: "Receipt review",
              active: "Active",
              suspended: "Access paused",
              rejected: "Rejected",
            };
            return (
              <Link
                key={key}
                href={key === "all" ? "/admin/applicants" : `/admin/applicants?status=${key}`}
                className={`rounded-2xl border p-4 transition ${active ? "border-[#1E4488] bg-[#1E4488] text-white" : "border-[#dce5f1] bg-white text-[#1B365F] hover:border-[#1E4488]"}`}
              >
                <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${active ? "text-[#FFCF00]" : "text-[#708099]"}`}>{labels[key]}</p>
                <p className="mt-1 font-serif text-3xl">{counts[key as keyof typeof counts]}</p>
              </Link>
            );
          })}
        </div>

        <form method="get" className="rounded-[24px] bg-white p-5 shadow-sm">
          <input type="hidden" name="status" value={filter} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm font-medium text-[#1B365F] lg:col-span-1">
              Search
              <input className="input mt-1.5" name="q" defaultValue={params.q ?? ""} placeholder="Name or email…" />
            </label>
            <div className="text-sm font-medium text-[#1B365F] sm:col-span-2">
              Joined date
              <div className="mt-1.5 flex gap-2">
                <input className="input" name="joinedFrom" type="date" defaultValue={joinedFrom} aria-label="Joined from" />
                <input className="input" name="joinedTo" type="date" defaultValue={joinedTo} aria-label="Joined to" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn btn-dark" type="submit">Apply filters</button>
            <Link href="/admin/applicants" className="btn btn-ghost">Clear</Link>
            <span className="text-sm text-[#708099]">{rows.length} applicant{rows.length === 1 ? "" : "s"} match</span>
          </div>
        </form>

        <section className="flex flex-wrap gap-4 rounded-[24px] bg-[#1B365F] p-5 text-white">
          <div className="flex-1 min-w-[180px]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#FFCF00]">Onboarding</p>
            <p className="mt-1 font-serif text-2xl">{onboarding} / {applicants.length}</p>
            <p className="text-xs text-white/70">guide completed & password changed</p>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#FFCF00]">Payments</p>
            <p className="mt-1 font-serif text-2xl">{allPayments.filter((item) => item.status === "pending").length} pending</p>
            <p className="text-xs text-white/70">{allPayments.filter((item) => item.status === "verified").length} verified · {allPayments.filter((item) => item.status === "rejected").length} rejected</p>
          </div>
          <div className="flex-1 min-w-[180px]">
            <p className="text-xs uppercase tracking-[0.18em] text-[#FFCF00]">Exams</p>
            <p className="mt-1 font-serif text-2xl">{allAttempts.length} sittings</p>
            <p className="text-xs text-white/70">{allProgress.filter((item) => item.status === "passed").length} level passes</p>
          </div>
        </section>

        <section className="rounded-[26px] bg-white p-5 shadow-sm">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Account</th>
                  <th>Chapter</th>
                  <th>Membership</th>
                  <th>Onboarding</th>
                  <th>Payment</th>
                  <th>Level</th>
                  <th>Exams</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ applicant, payment, open, openLevel, passedCount, attempts, best }) => (
                  <tr key={applicant.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar id={applicant.id} name={applicant.fullName} size="sm" />
                        <div>
                          <p className="font-semibold text-[#1B365F]">{applicant.fullName}</p>
                          <p className="text-xs text-[#708099]">{applicant.email}</p>
                        </div>
                      </div>
                    </td>
                    <td><StatusChip status={applicant.accountStatus} /></td>
                    <td className="text-xs text-[#52657A]">{readRegistrationValue(applicant, fieldMap.chapter) || "—"}</td>
                    <td className="text-xs text-[#52657A]">{readRegistrationValue(applicant, fieldMap.membershipStatus) || "—"}</td>
                    <td className="text-xs text-[#52657A]">
                      <p>{applicant.guideCompletedAt ? "✓ Guide" : "— Guide"}</p>
                      <p>{applicant.passwordChangedAt ? "✓ Password" : "— Password"}</p>
                    </td>
                    <td className="text-xs text-[#52657A]">
                      {payment ? (
                        <>
                          <p className="font-semibold">
                            {PURPOSE_LABELS[(payment.purpose ?? "registration") as keyof typeof PURPOSE_LABELS] ?? "Registration fee"}
                          </p>
                          <StatusChip status={payment.status} />
                        </>
                      ) : (
                        <span className="text-[#8895A6]">No receipt</span>
                      )}
                    </td>
                    <td className="text-xs text-[#52657A]">
                      {open ? (
                        <>
                          <p className="font-semibold">L{openLevel?.number ?? "—"} · {openLevel?.name ?? ""}</p>
                          <StatusChip status={open.status} />
                        </>
                      ) : passedCount >= 5 ? (
                        <span className="text-[#00694B]">All 5 levels passed</span>
                      ) : (
                        <span className="text-[#8895A6]">No progress</span>
                      )}
                    </td>
                    <td className="text-xs text-[#52657A]">
                      <p>{attempts} attempt{attempts === 1 ? "" : "s"}</p>
                      <p className="font-semibold text-[#1E4488]">best {best}%</p>
                    </td>
                    <td className="text-xs text-[#708099]">{formatDate(applicant.createdAt)}</td>
                    <td>
                      <ApplicantActions
                        form={form}
                        googleMapsApiKey={googleMapsApiKey}
                        member={{
                          id: applicant.id,
                          fullName: applicant.fullName,
                          email: applicant.email,
                          phone: applicant.phone,
                          address: applicant.address,
                          latitude: applicant.latitude,
                          longitude: applicant.longitude,
                          education: applicant.education,
                          accountStatus: applicant.accountStatus,
                          registrationAnswers: parseAnswers(applicant.registrationAnswers),
                        }}
                      />
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-sm text-[#708099]">No applicants in this status.</td>
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
