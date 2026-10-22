import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { levels, questionBanks, questions } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { BankCreateForm } from "@/components/admin/BankCreateForm";
import { requireAdminPage } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function BanksPage() {
  const admin = await requireAdminPage();
  const banks = await db.select().from(questionBanks);
  const program = await db.select().from(levels).orderBy(levels.number);
  const counts = await db.select({ bankId: questions.bankId, id: questions.id }).from(questions);
  const byBank = new Map<number, number>();
  for (const row of counts) {
    byBank.set(row.bankId, (byBank.get(row.bankId) ?? 0) + 1);
  }

  return (
    <AppShell user={admin} nav={adminNav} title="Question banks">
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[28px] bg-white p-6">
          <h2 className="font-serif text-2xl">New bank</h2>
          <BankCreateForm levels={program} />
        </section>
        <section className="rounded-[28px] bg-white p-6">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Bank</th>
                  <th>Level</th>
                  <th>Questions</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => {
                  const level = program.find((item) => item.id === bank.levelId);
                  return (
                    <tr key={bank.id}>
                      <td>{bank.name}</td>
                      <td>{level ? `Level ${level.number}` : "General"}</td>
                      <td>{byBank.get(bank.id) ?? 0}</td>
                      <td>
                        <Link className="text-[#0076AF]" href={`/admin/banks/${bank.id}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
