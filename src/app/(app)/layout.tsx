import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { TrialBanner } from "@/components/trial-banner";
import { getUserPlan } from "@/lib/plan";
import { headers } from "next/headers";

const ALLOWED_WHEN_LOCKED = ["/billing", "/locked"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;
  const plan = await getUserPlan(userId);

  // Read pathname (set by middleware). Fall back to "" if missing.
  const path = headers().get("x-pathname") || "";
  const onAllowed = ALLOWED_WHEN_LOCKED.some((p) => path.startsWith(p));

  if (plan && !plan.state.hasAccess && !onAllowed) {
    redirect("/locked");
  }

  return (
    <AppShell>
      {plan?.state.isTrial && <TrialBanner daysLeft={plan.state.daysLeft} />}
      {plan?.state.status === "CANCELLED" && plan.state.daysLeft > 0 && (
        <TrialBanner daysLeft={plan.state.daysLeft} cancelled />
      )}
      {children}
    </AppShell>
  );
}
