import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ListFilter } from "lucide-react";
import { db } from "@/db";
import { levelProgress, levels, settings, users } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { MembersManager, type MemberRow } from "@/components/admin/MembersManager";
import { requireAdminPage } from "@/lib/guards";
import { mapRegistrationFields, normalizeRegistrationForm, parseAnswers, readRegistrationValue } from "@/lib/registration-form";
import { computeAge, normalizeText } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending_payment", label: "Awaiting payment" },
  { value: "pending_verification", label: "Receipt review" },
  { value: "suspended", label: "Access paused" },
  { value: "rejected", label: "Rejected" },
];

export default async function AdminMembersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdminPage();
  const params = await searchParams;
  const q = normalizeText(params.q ?? "");
  const status = params.status ?? "all";
  const ageMin = params.ageMin ? Number(params.ageMin) : null;
  const ageMax = params.ageMax ? Number(params.ageMax) : null;
  const levelQ = params.level ?? "all";
  const sort = params.sort ?? "newest";
  const chapter = params.chapter ?? "all";
  const membership = params.membership ?? "all";
  const joinedFrom = params.joinedFrom ?? "";
  const joinedTo = params.joinedTo ?? "";

  const academy = (await db.select().from(settings).limit(1))[0];
  const form = normalizeRegistrationForm(academy?.registrationForm);
  const googleMapsApiKey = academy?.googleMapsApiKey?.trim() ?? "";
  const fieldMap = mapRegistrationFields(form);
  const chapterOptions = form.fields.find((field) => field.key === fieldMap.chapter)?.options ?? [];
  const membershipOptions = form.fields.find((field) => field.key === fieldMap.membershipStatus)?.options ?? [];

  const allUsers = await db
    .select()
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(desc(users.createdAt));
  const allLevels = await db.select().from(levels).orderBy(levels.number);
  const levelById = new Map(allLevels.map((level) => [level.id, level]));
  const progressRows = await db.select().from(levelProgress);
  const progressByUser = new Map<number, typeof progressRows>();
  for (const row of progressRows) {
    const list = progressByUser.get(row.userId) ?? [];
    list.push(row);
    progressByUser.set(row.userId, list);
  }

  const from = joinedFrom ? new Date(`${joinedFrom}T00:00:00`) : null;
  const to = joinedTo ? new Date(`${joinedTo}T23:59:59.999`) : null;

  const rows = allUsers
    .map((user) => {
      const progress = progressByUser.get(user.id) ?? [];
      const passed = progress.filter((item) => item.status === "passed").length;
      const open =
        progress.find((item) => item.status === "unlocked" || item.status === "in_progress") ??
        progress.find((item) => item.status !== "passed");
      const openLevel = open ? levelById.get(open.levelId) : undefined;
      const levelKey = !progress.length ? 0 : open ? openLevel?.number ?? 0 : 6;
      return {
        user,
        age: computeAge(user.birthDate),
        levelLabel: !progress.length
          ? "No progress"
          : open
            ? `L${openLevel?.number ?? "—"} · ${openLevel?.name ?? ""}`
            : "Complete",
        levelKey,
        passedCount: passed,
      };
    })
    .filter(({ user, age, levelKey }) => {
      if (status !== "all" && user.accountStatus !== status) return false;
      if (q && !normalizeText(`${user.fullName} ${user.email}`).includes(q)) return false;
      if (levelQ !== "all") {
        const want = Number(levelQ);
        if (want === 6 && levelKey !== 6) return false;
        if (want >= 1 && want <= 5 && levelKey !== want) return false;
        if (want === 0 && levelKey !== 0) return false;
      }
      if (ageMin !== null && (age === null || age < ageMin)) return false;
      if (ageMax !== null && (age === null || age > ageMax)) return false;
      if (chapter !== "all" && readRegistrationValue(user, fieldMap.chapter) !== chapter) return false;
      if (membership !== "all" && readRegistrationValue(user, fieldMap.membershipStatus) !== membership) return false;
      if (from && user.createdAt < from) return false;
      if (to && user.createdAt > to) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.user.fullName.localeCompare(b.user.fullName);
      if (sort === "age") return (a.age ?? -1) - (b.age ?? -1);
      if (sort === "level") return b.levelKey - a.levelKey;
      return b.user.createdAt.getTime() - a.user.createdAt.getTime();
    });

  const memberRows: MemberRow[] = rows.map(({ user, age, levelLabel, passedCount }) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    education: user.education,
    latitude: user.latitude,
    longitude: user.longitude,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt.toISOString(),
    profileBio: user.profileBio,
    professionalHeadline: user.professionalHeadline,
    resumeSummary: user.resumeSummary,
    skills: user.skills,
    experience: user.experience,
    birthDate: user.birthDate,
    profilePhoto: user.profilePhoto,
    registrationAnswers: parseAnswers(user.registrationAnswers),
    registrationDetails: user.registrationDetails,
    age,
    levelLabel,
    passedCount,
  }));

  return (
    <AppShell user={admin} nav={adminNav} title="Members">
      <div className="mx-auto max-w-7xl space-y-6">
        <form method="get" className="rounded-[24px] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#E8F4FA] text-[#0076AF]"><ListFilter size={18} /></span>
            <div>
              <h2 className="font-serif text-xl text-[#1B365F]">Filters</h2>
              <p className="text-xs text-[#708099]">Narrow the member list by account, registration, and progress.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <label className="text-sm font-medium text-[#1B365F]">
              Search
              <input className="input mt-1.5" name="q" defaultValue={params.q ?? ""} placeholder="Name or email…" />
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              Account status
              <select className="input mt-1.5" name="status" defaultValue={status}>
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              DeMolay Chapter
              <select className="input mt-1.5" name="chapter" defaultValue={chapter}>
                <option value="all">All chapters</option>
                {chapterOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              Membership status
              <select className="input mt-1.5" name="membership" defaultValue={membership}>
                <option value="all">All membership types</option>
                {membershipOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-[#1B365F]">
              LMS level
              <select className="input mt-1.5" name="level" defaultValue={levelQ}>
                <option value="all">All levels</option>
                <option value="0">No progress</option>
                {allLevels.map((level) => (
                  <option key={level.id} value={level.number}>Level {level.number}</option>
                ))}
                <option value="6">Complete</option>
              </select>
            </label>
            <div className="text-sm font-medium text-[#1B365F]">
              Age range
              <div className="mt-1.5 flex gap-2">
                <input className="input" name="ageMin" type="number" min={1} max={99} defaultValue={params.ageMin ?? ""} placeholder="Min" />
                <input className="input" name="ageMax" type="number" min={1} max={99} defaultValue={params.ageMax ?? ""} placeholder="Max" />
              </div>
            </div>
            <div className="text-sm font-medium text-[#1B365F]">
              Joined date
              <div className="mt-1.5 flex gap-2">
                <input className="input" name="joinedFrom" type="date" defaultValue={joinedFrom} aria-label="Joined from" />
                <input className="input" name="joinedTo" type="date" defaultValue={joinedTo} aria-label="Joined to" />
              </div>
            </div>
            <label className="text-sm font-medium text-[#1B365F]">
              Sort
              <select className="input mt-1.5" name="sort" defaultValue={sort}>
                <option value="newest">Newest joined</option>
                <option value="name">Name A–Z</option>
                <option value="age">Age</option>
                <option value="level">Level (high first)</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="btn btn-dark" type="submit">Apply filters</button>
            <Link href="/admin/members" className="btn btn-ghost">Clear</Link>
            <span className="text-sm text-[#708099]">{rows.length} member{rows.length === 1 ? "" : "s"} match</span>
          </div>
        </form>

        <MembersManager members={memberRows} form={form} googleMapsApiKey={googleMapsApiKey} />
      </div>
    </AppShell>
  );
}
