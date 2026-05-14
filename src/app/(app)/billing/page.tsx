import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { BillingPanel } from "./_panel";
import { computePlanState, PLAN_PRICE } from "@/lib/plan";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as any).id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      planStatus: true,
      planExpiresAt: true,
      trialEndsAt: true,
      lastPaymentAt: true,
    },
  });

  if (!user) redirect("/login");

  const state = computePlanState(user);
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Abonnement"
        description={`Plan LogiStock — ${PLAN_PRICE.toFixed(2)} € / mois`}
      />
      <BillingPanel
        user={{
          ...user,
          planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
          trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
          lastPaymentAt: user.lastPaymentAt?.toISOString() ?? null,
        }}
        state={state}
        payments={payments.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() }))}
      />
    </div>
  );
}
