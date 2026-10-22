import { redirect } from "next/navigation";
import { destroySession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  await destroySession();
  redirect("/login");
}
