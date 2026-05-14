import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { SubscriptionsTable } from "./_table";
import { CreditCard, RefreshCw, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") notFound();

  const subs = await prisma.subscription.findMany({ orderBy: { createdAt: "desc" } });
  const active = subs.filter((s) => s.status === "ACTIVE");

  const monthlyMRR = active.reduce(
    (sum, s) => sum + (s.frequency === "YEARLY" ? s.amount / 12 : s.amount),
    0
  );
  const yearlyARR = monthlyMRR * 12;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonnements"
        description="Gérez vos abonnements clients et revenus récurrents"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Abonnés actifs" value={active.length} icon={Users} hint={`${subs.length} au total`} />
        <StatCard label="MRR (revenu mensuel)" value={formatCurrency(monthlyMRR)} icon={CreditCard} />
        <StatCard label="ARR (revenu annuel)" value={formatCurrency(yearlyARR)} icon={TrendingUp} />
        <StatCard
          label="Plans"
          value={new Set(active.map((s) => s.plan)).size}
          icon={RefreshCw}
          hint="Différents plans actifs"
        />
      </div>

      <SubscriptionsTable
        subscriptions={subs.map((s) => ({
          ...s,
          startDate: s.startDate.toISOString(),
          nextBillingDate: s.nextBillingDate?.toISOString() ?? null,
          createdAt: s.createdAt.toISOString(),
          updatedAt: s.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
