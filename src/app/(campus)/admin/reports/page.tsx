import { PageHeader, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAdminReport } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireRole(["admin"]);
  const report = await getAdminReport();
  const maxAwarded = Math.max(...report.badgeCounts.map((row) => row.awarded), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Reports"
        title="How the council is progressing"
        text="A friendly snapshot of advancement activity across the council."
      />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={report.users} icon="👥" tone="#ffd166" />
        <StatCard label="Programs" value={report.programs} icon="⚜️" tone="#cbb6ff" />
        <StatCard label="Badges" value={report.badges} icon="🎖️" tone="#b8f2e6" />
        <StatCard label="Badges awarded" value={report.awarded} icon="🏅" tone="#ffd0e3" />
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="bloom-card p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Roles</p>
          <p className="mt-2 text-sm font-extrabold">Council Admins {report.roleCounts.admin}</p>
          <p className="text-sm font-extrabold">Scout Leaders {report.roleCounts.teacher}</p>
          <p className="text-sm font-extrabold">Scouts {report.roleCounts.student}</p>
        </div>
        <div className="bloom-card p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Submissions</p>
          <p className="font-display text-4xl">{report.submissions}</p>
          <p className="text-sm">{report.pending} awaiting an approval</p>
        </div>
        <div className="bloom-card p-5">
          <p className="text-sm font-bold text-[var(--muted)]">Badges awarded</p>
          <p className="font-display text-4xl">{report.awarded}</p>
          <p className="text-sm">Across all programs</p>
        </div>
      </div>

      <div className="bloom-card p-5">
        <h2 className="font-display mb-4 text-2xl">Most awarded badges</h2>
        <div className="space-y-3">
          {report.badgeCounts.map((badge) => (
            <div key={badge.id}>
              <div className="mb-1 flex justify-between text-sm font-extrabold">
                <span>
                  {badge.name}{" "}
                  <span className="text-xs font-bold text-[var(--muted)]">
                    {badge.programName} · {badge.kind}
                  </span>
                </span>
                <span>{badge.awarded}</span>
              </div>
              <div className="progress-rail">
                <div className="progress-fill" style={{ width: `${(badge.awarded / maxAwarded) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
