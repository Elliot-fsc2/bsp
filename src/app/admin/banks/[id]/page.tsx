import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ChevronDown } from "lucide-react";
import { db } from "@/db";
import { questionBanks, questions } from "@/db/schema";
import { AppShell, adminNav } from "@/components/AppShell";
import { QuestionBuilder } from "@/components/admin/QuestionBuilder";
import { QuestionDeleteButton } from "@/components/admin/QuestionDeleteButton";
import { requireAdminPage } from "@/lib/guards";
import type { CorrectAnswer, QuestionOptions } from "@/lib/types";

export const dynamic = "force-dynamic";

function plainPrompt(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export default async function BankDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const bank = (await db.select().from(questionBanks).where(eq(questionBanks.id, Number(id))).limit(1))[0];
  if (!bank) notFound();
  const items = await db.select().from(questions).where(eq(questions.bankId, bank.id));

  return (
    <AppShell user={admin} nav={adminNav} title={bank.name}>
      <p className="mb-6 max-w-2xl text-sm text-[#64758A]">{bank.description}</p>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] bg-white p-6">
          <h2 className="font-serif text-2xl">Add question</h2>
          <div className="mt-4">
            <QuestionBuilder bankId={bank.id} />
          </div>
        </section>
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-2xl">Questions · {items.length}</h2>
            <span className="text-xs text-[#708099]">Click a question to expand and edit</span>
          </div>
          {items.map((question) => (
            <details key={question.id} className="group overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(17,44,70,0.06)]">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EAF1F9] font-serif text-sm font-bold text-[#1E4488]">
                  {String(question.id).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
                    {question.type.replaceAll("_", " ")} · {question.points} pt
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-[#1B365F]">{plainPrompt(question.prompt)}</p>
                </div>
                <ChevronDown size={18} className="shrink-0 text-[#8a93a6] transition group-open:rotate-180" />
              </summary>
              <div className="border-t border-[#eef2f8] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: question.prompt }} />
                  <QuestionDeleteButton id={question.id} />
                </div>
                <div className="mt-5">
                  <QuestionBuilder
                    bankId={bank.id}
                    question={{
                      id: question.id,
                      type: question.type,
                      prompt: question.prompt,
                      options: (question.options ?? null) as QuestionOptions | null,
                      correctAnswer: (question.correctAnswer ?? null) as CorrectAnswer | null,
                      points: question.points,
                      explanation: question.explanation,
                    }}
                  />
                </div>
              </div>
            </details>
          ))}
          {!items.length ? (
            <div className="rounded-[24px] border border-dashed border-[#b9c9e0] bg-white p-10 text-center text-sm text-[#708099]">
              No questions in this bank yet. Add one on the left.
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}