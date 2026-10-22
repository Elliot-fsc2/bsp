import { statusLabel } from "@/lib/utils";

const TONES: Record<string, string> = {
  active: "bg-[#E9F5EA] text-[#00694B]",
  approved: "bg-[#E9F5EA] text-[#00694B]",
  passed: "bg-[#E9F5EA] text-[#00694B]",
  verified: "bg-[#E9F5EA] text-[#00694B]",
  graded: "bg-[#E9F5EA] text-[#00694B]",
  unlocked: "bg-[#FFF5CB] text-[#705100]",
  pending: "bg-[#FFF5CB] text-[#705100]",
  pending_payment: "bg-[#FFF5CB] text-[#705100]",
  pending_verification: "bg-[#FFF5CB] text-[#705100]",
  pending_review: "bg-[#FFF5CB] text-[#705100]",
  in_progress: "bg-[#E8F4FA] text-[#005695]",
  submitted: "bg-[#E8F4FA] text-[#005695]",
  locked: "bg-[#EEF2F7] text-[#64758A]",
  rejected: "bg-[#FFF0EF] text-[#AC242A]",
  failed: "bg-[#FFF0EF] text-[#AC242A]",
  suspended: "bg-[#FFF0EF] text-[#AC242A]",
};

export function StatusChip({ status }: { status: string }) {
  return <span className={`chip ${TONES[status] ?? "bg-[#EEF2F7] text-[#64758A]"}`}>{statusLabel(status)}</span>;
}
