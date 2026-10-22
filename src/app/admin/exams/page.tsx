import { eq } from "drizzle-orm";
import { db } from "@/db";
import { exams, levels, questionBanks } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { ExamEditor } from "@/components/admin/ExamEditor";
import { requireAdminPage } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function AdminExamsPage() {
  const admin = await requireAdminPage();
  const rows = await db
    .select({ exam: exams, level: levels })
    .from(exams)
    .innerJoin(levels, eq(exams.levelId, levels.id))
    .orderBy(levels.number);
  const banks = await db.select().from(questionBanks);

  return (
    <AppShell user={admin} nav={adminNav} title="Exams">
      <p className="mb-6 max-w-2xl text-sm leading-6 text-[#64758A]">
        Each level has one general exam. Bind a question bank, choose how many items to draw, shuffle,
        time limit, passing score, and attempt cap.
      </p>
      <div className="grid gap-5">
        {rows.map(({ exam, level }) => (
          <section key={exam.id}>
            <h2 className="mb-3 font-serif text-2xl">
              Level {level.number}: {level.name}
            </h2>
            <ExamEditor exam={exam} banks={banks} />
          </section>
        ))}
      </div>
    </AppShell>
  );
}
