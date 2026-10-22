import Link from "next/link";
import { PageHeader, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { getAdminReport, getUsers } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireRole(["admin"]);
  const [report, settings, users] = await Promise.all([getAdminReport(), getSettings(), getUsers()]);
  const recent = users.slice(-5).reverse();

  return (
    <div>
      <PageHeader
        eyebrow="Council office"
        title="Council dashboard"
        text={`Theme: ${settings.theme} · ${settings.mascotName} is on duty.`}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Members" value={report.users} icon="👥" tone="#ffd166" />
        <StatCard label="Programs" value={report.programs} icon="⚜️" tone="#cbb6ff" />
        <StatCard label="Badges" value={report.badges} icon="🎖️" tone="#b8f2e6" />
        <StatCard label="Awaiting approval" value={report.pending} icon="✅" tone="#ffd0e3" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="bloom-card p-5">
          <h2 className="font-display text-2xl">Shortcuts</h2>
          <div className="mt-4 grid gap-2">
            {[
              ["/admin/programs", "Programs, ranks, and merit badges"],
              ["/admin/badges", "All badges and their requirements"],
              ["/admin/categories", "Add or edit advancement categories"],
              ["/admin/users", "Invite members and set roles"],
              ["/admin/reports", "See how the council is progressing"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-2xl bg-white/80 px-4 py-3 font-extrabold">
                {label} →
              </Link>
            ))}
          </div>
        </div>
        <div className="bloom-card p-5">
          <h2 className="font-display text-2xl">Newest members</h2>
          <div className="mt-3 space-y-2">
            {recent.map((person) => (
              <div key={person.id} className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2">
                <span className="font-bold">{person.name}</span>
                <span className="text-xs font-extrabold uppercase">{person.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
