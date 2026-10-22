"use client";

import { useState } from "react";
import { formatDate, formatMoney } from "@/lib/utils";

export type SummaryRow = {
  title: string;
  qty: number;
  priceCents: number;
  totalCents: number;
  gppCents: number;
  scodCents: number;
};

export type StatusRow = { status: string; qty: number; amountCents: number };
export type LevelRow = { number: number; name: string; attempts: number; retakes: number; passed: number; notPassed: number; avgScore: number | null };
export type PaymentRecord = {
  id: number;
  member: string;
  email: string;
  purpose: string;
  reference: string;
  status: string;
  amountCents: number;
  submittedAt: string;
};

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "breakdown", label: "Breakdown" },
  { id: "attempts", label: "Attempts" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ReportsTabs({
  summary,
  summaryTotals,
  registrationByStatus,
  retakeRevenueCents,
  retakeCount,
  levels,
  totals,
  payments,
  currency,
}: {
  summary: SummaryRow[];
  summaryTotals: SummaryRow;
  registrationByStatus: StatusRow[];
  retakeRevenueCents: number;
  retakeCount: number;
  levels: LevelRow[];
  totals: { attempts: number; retakes: number; passed: number };
  payments: PaymentRecord[];
  currency: string;
}) {
  const [tab, setTab] = useState<TabId>("summary");
  const money = (cents: number) => formatMoney(cents, currency);

  return (
    <section className="rounded-[28px] border border-[#dce5f1] bg-white p-5 shadow-sm sm:p-6 md:p-8">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
              tab === item.id ? "bg-[#1B365F] text-white" : "bg-[#F3F6FA] text-[#52657A] hover:bg-[#e7eef7]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "summary" ? (
        <div className="mt-6">
          <h3 className="font-serif text-2xl text-[#1B365F]">Summary report</h3>
          <p className="mt-1 text-sm text-[#708099]">Verified submissions only. GPP share is 20%; the remainder is SCOD income.</p>
          <div className="table-wrap mt-4">
            <table className="data cards">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="text-right">QTY</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">To be Credited to GPP (20%)</th>
                  <th className="text-right">SCOD Income</th>
                </tr>
              </thead>
              <tbody>
                {summary.map((row) => (
                  <tr key={row.title}>
                    <td data-label="Title" className="font-semibold text-[#1B365F]">{row.title}</td>
                    <td data-label="QTY" className="text-right">{row.qty}</td>
                    <td data-label="Price" className="text-right">{money(row.priceCents)}</td>
                    <td data-label="Total" className="text-right font-semibold text-[#1B365F]">{money(row.totalCents)}</td>
                    <td data-label="GPP (20%)" className="text-right text-[#AC242A]">{money(row.gppCents)}</td>
                    <td data-label="SCOD income" className="text-right text-[#00694B]">{money(row.scodCents)}</td>
                  </tr>
                ))}
                <tr className="bg-[#F7F9FD] font-bold text-[#1B365F]">
                  <td data-label="Title">Total</td>
                  <td data-label="QTY" className="text-right">{summaryTotals.qty}</td>
                  <td data-label="Price" className="text-right">—</td>
                  <td data-label="Total" className="text-right">{money(summaryTotals.totalCents)}</td>
                  <td data-label="GPP (20%)" className="text-right text-[#AC242A]">{money(summaryTotals.gppCents)}</td>
                  <td data-label="SCOD income" className="text-right text-[#00694B]">{money(summaryTotals.scodCents)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "breakdown" ? (
        <div className="mt-6 space-y-8">
          <div>
            <h3 className="font-serif text-2xl text-[#1B365F]">Registration breakdown</h3>
            <p className="mt-1 text-sm text-[#708099]">Registration fee payments grouped by review status.</p>
            <div className="table-wrap mt-4">
              <table className="data cards">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th className="text-right">QTY</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {registrationByStatus.map((row) => (
                    <tr key={row.status}>
                      <td data-label="Status" className="font-semibold capitalize text-[#1B365F]">{row.status}</td>
                      <td data-label="QTY" className="text-right">{row.qty}</td>
                      <td data-label="Amount" className="text-right font-semibold text-[#1B365F]">{money(row.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-2xl text-[#1B365F]">Level retake breakdown</h3>
            <p className="mt-1 text-sm text-[#708099]">
              Attempts beyond the first per member/level. Retake revenue: <strong>{money(retakeRevenueCents)}</strong> ({retakeCount} verified retake payment{retakeCount === 1 ? "" : "s"}).
            </p>
            <div className="table-wrap mt-4">
              <table className="data cards">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th className="text-right">Attempts</th>
                    <th className="text-right">Retakes</th>
                    <th className="text-right">Passed</th>
                    <th className="text-right">Not passed</th>
                    <th className="text-right">Avg score</th>
                  </tr>
                </thead>
                <tbody>
                  {levels.map((row) => (
                    <tr key={row.number}>
                      <td data-label="Level" className="font-semibold text-[#1B365F]">Level {row.number} · {row.name}</td>
                      <td data-label="Attempts" className="text-right">{row.attempts}</td>
                      <td data-label="Retakes" className="text-right">{row.retakes}</td>
                      <td data-label="Passed" className="text-right text-[#00694B]">{row.passed}</td>
                      <td data-label="Not passed" className="text-right text-[#AC242A]">{row.notPassed}</td>
                      <td data-label="Avg score" className="text-right">{row.avgScore === null ? "—" : `${row.avgScore}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-serif text-2xl text-[#1B365F]">Payment records</h3>
            <div className="table-wrap mt-4">
              <table className="data cards">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Purpose</th>
                    <th>Reference</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((row) => (
                    <tr key={row.id}>
                      <td data-label="Member">
                        <span className="text-right">
                          <span className="font-semibold text-[#1B365F]">{row.member}</span>
                          <span className="block text-xs text-[#708099]">{row.email}</span>
                        </span>
                      </td>
                      <td data-label="Purpose" className="capitalize font-medium text-[#1B365F]">{row.purpose.replaceAll("_", " ")}</td>
                      <td data-label="Reference" className="font-mono text-xs text-[#0076AF]">{row.reference}</td>
                      <td data-label="Amount" className="text-right font-semibold text-[#1B365F]">{money(row.amountCents)}</td>
                      <td data-label="Status" className="capitalize text-[#52657A]">{row.status}</td>
                      <td data-label="Date" className="text-xs text-[#708099]">{formatDate(row.submittedAt)}</td>
                    </tr>
                  ))}
                  {!payments.length ? (
                    <tr><td colSpan={6} className="py-6 text-center text-sm text-[#708099]">No payment records found.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "attempts" ? (
        <div className="mt-6">
          <h3 className="font-serif text-2xl text-[#1B365F]">Exam attempts</h3>
          <p className="mt-1 text-sm text-[#708099]">Every sitting recorded per level.</p>
          <div className="table-wrap mt-4">
            <table className="data cards">
              <thead>
                <tr>
                  <th>Level</th>
                  <th className="text-right">Attempts</th>
                  <th className="text-right">Passed</th>
                  <th className="text-right">Not passed</th>
                  <th className="text-right">Avg score</th>
                </tr>
              </thead>
              <tbody>
                {levels.map((row) => (
                  <tr key={row.number}>
                    <td data-label="Level" className="font-semibold text-[#1B365F]">Level {row.number} · {row.name}</td>
                    <td data-label="Attempts" className="text-right">{row.attempts}</td>
                    <td data-label="Passed" className="text-right text-[#00694B]">{row.passed}</td>
                    <td data-label="Not passed" className="text-right text-[#AC242A]">{row.notPassed}</td>
                    <td data-label="Avg score" className="text-right">{row.avgScore === null ? "—" : `${row.avgScore}%`}</td>
                  </tr>
                ))}
                <tr className="bg-[#F7F9FD] font-bold text-[#1B365F]">
                  <td data-label="Level">Total</td>
                  <td data-label="Attempts" className="text-right">{totals.attempts}</td>
                  <td data-label="Passed" className="text-right text-[#00694B]">{totals.passed}</td>
                  <td data-label="Not passed" className="text-right text-[#AC242A]">{totals.attempts - totals.passed}</td>
                  <td data-label="Avg score" className="text-right">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
