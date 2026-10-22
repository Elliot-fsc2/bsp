import Link from "next/link";
import { CalendarDays, CheckCircle, Megaphone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { BadgeCard, PageHeader, StatCard } from "@/components/ui";
import { Modal } from "@/components/Modal";
import { toPlainText } from "@/lib/richtext";
import { formatDate, greetingForNow, relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const settings = await getSettings();
  const data = await getDashboardData(user);
  const readyToApply = data.badges.filter((badge) => badge.canApply);

  return (
    <div>
      <PageHeader
        eyebrow={`${settings.mascotName} saved you a seat`}
        title={greetingForNow(user.name)}
        text={
          user.role === "admin"
            ? "The council office is open. Review approvals and watch the movement grow."
            : user.role === "teacher"
              ? "Your approval queue and your Scouts' progress are ready."
              : "Pick up your badge, complete the next requirement, or start something new."
        }
        action={
          <Link href="/advancement" className="bloom-btn">
            {user.role === "student" ? "Browse badges" : "Advancement"}
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Badges earned" value={data.awarded.length} icon="🏅" tone="#ffd166" />
        <StatCard label="In progress" value={data.totals.inProgress} icon="🧭" tone="#cbb6ff" />
        <StatCard label="Ready to submit" value={readyToApply.length} icon="📤" tone="#b8f2e6" />
        <StatCard
          label={user.role === "student" ? "Council news" : "Needs approval"}
          value={user.role === "student" ? data.announcements.length : data.pendingApprovals.length}
          icon={user.role === "student" ? "📣" : "✅"}
          tone="#ffd0e3"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-2xl">Continue your advancement</h2>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/my-advancement" className="text-sm font-extrabold text-[var(--secondary)]">
                  What&apos;s left to do →
                </Link>
                <Link href="/advancement" className="text-sm font-extrabold text-[var(--secondary)]">
                  All badges →
                </Link>
              </div>
            </div>
            {data.inProgress.length === 0 ? (
              <p className="bloom-card p-6 text-[var(--muted)]">
                No badge started yet.{" "}
                <Link href="/advancement" className="font-extrabold text-[var(--secondary)]">
                  Choose a program
                </Link>{" "}
                and begin with the Membership Badge.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {data.inProgress.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </div>

          {data.awarded.length > 0 ? (
            <div>
              <h2 className="font-display mb-3 text-2xl">Earned badges</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.awarded.map((badge) => (
                  <Link key={badge.id} href={`/advancement/badge/${badge.badgeId}`} className="bloom-card flex items-center gap-3 p-3">
                    {badge.badgeImage ? <img src={badge.badgeImage} alt="" className="h-12 w-12" /> : <span className="text-2xl">🎖️</span>}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">{badge.badgeName}</span>
                      <span className="block text-xs text-[var(--muted)]">{badge.programName}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-3">
          <Modal
            title="Coming up"
            description="Everything on the council calendar."
            trigger={
              <span className="flex w-full items-center gap-3">
                <CalendarDays size={18} /> Coming up
                <span className="chip ml-auto">{data.events.length}</span>
              </span>
            }
            triggerClass="bloom-card flex w-full items-center gap-3 p-4 text-left font-extrabold"
          >
            <div className="space-y-3">
              {data.events.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Nothing on the calendar yet.</p>
              ) : (
                data.events.map((event) => (
                  <div key={event.id} className="rounded-2xl bg-white/80 p-3">
                    <p className="text-sm font-extrabold">{event.title}</p>
                    <p className="text-xs text-[var(--muted)]">{formatDate(event.startAt)}</p>
                  </div>
                ))
              )}
            </div>
          </Modal>

          <div className="bloom-card p-4">
            <div className="flex items-center gap-3">
              <Megaphone size={18} />
              <span className="font-extrabold">Latest news</span>
              {data.announcements.length > 1 ? (
                <span className="chip ml-auto">{data.announcements.length}</span>
              ) : null}
            </div>
            {data.announcements.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--muted)]">No news yet.</p>
            ) : (
              <div className="mt-3 rounded-2xl bg-white/80 p-3">
                <p className="text-sm font-extrabold">{data.announcements[0].title}</p>
                <p className="line-clamp-3 text-xs text-[var(--muted)]">{toPlainText(data.announcements[0].body)}</p>
                <p className="mt-1 text-[11px] font-bold text-[var(--muted)]">
                  {data.announcements[0].authorName} · {relativeTime(data.announcements[0].createdAt)}
                </p>
              </div>
            )}
            <Link href="/announcements" className="mt-3 block text-sm font-extrabold text-[var(--secondary)]">
              View all news →
            </Link>
          </div>

          {user.role !== "student" ? (
            <Modal
              title="Approval tray"
              description="Submissions waiting for you."
              trigger={
                <span className="flex w-full items-center gap-3">
                  <CheckCircle size={18} /> Approval tray
                  <span className="chip ml-auto">{data.pendingApprovals.length}</span>
                </span>
              }
              triggerClass="bloom-card flex w-full items-center gap-3 p-4 text-left font-extrabold"
            >
              <div className="space-y-3">
                {data.pendingApprovals.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Inbox zero, Scout Leader glow.</p>
                ) : (
                  data.pendingApprovals.map((item) => (
                    <Link key={item.id} href={`/approvals/${item.id}`} className="block rounded-2xl bg-white/80 p-3">
                      <p className="text-sm font-extrabold">{item.requirementTitle ?? `${item.badgeName} — badge application`}</p>
                      <p className="text-xs text-[var(--muted)]">{item.scoutName}</p>
                    </Link>
                  ))
                )}
                <Link href="/approvals" className="block text-sm font-extrabold text-[var(--secondary)]">
                  Open approvals →
                </Link>
              </div>
            </Modal>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
