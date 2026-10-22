import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { PublicUser } from "@/lib/types";

const PAUSED_REDIRECT = "/dashboard/payment";

export async function requireStudentPage(options: { allowBeforeGuide?: boolean } = {}): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (!options.allowBeforeGuide && !user.guideCompletedAt) redirect("/about-demolay?welcome=1");
  return user;
}

export async function requireActiveMember(): Promise<PublicUser> {
  const user = await requireStudentPage();
  if (user.accountStatus !== "active") redirect(PAUSED_REDIRECT);
  return user;
}

export async function requireUnpausedMember(options: { allowBeforeGuide?: boolean } = {}): Promise<PublicUser> {
  const user = await requireStudentPage(options);
  if (user.accountStatus === "suspended") redirect(PAUSED_REDIRECT);
  return user;
}

export async function requireActiveOrPausedMember(): Promise<PublicUser> {
  const user = await requireStudentPage();
  if (user.accountStatus !== "active" && user.accountStatus !== "suspended") redirect(PAUSED_REDIRECT);
  return user;
}

export async function requireAdminPage(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard");
  return user;
}
