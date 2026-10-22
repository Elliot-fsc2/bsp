import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { WelcomeGuide } from "@/components/WelcomeGuide";

export const dynamic = "force-dynamic";

export default async function AboutDeMolayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");
  if (user.guideCompletedAt) redirect(user.passwordChangedAt ? "/dashboard" : "/dashboard/profile?changePassword=1");
  return <WelcomeGuide name={user.fullName} />;
}
