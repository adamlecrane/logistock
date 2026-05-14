import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { MonthlyRevenueChart } from "@/components/charts";
import { getDashboardStats } from "@/lib/stats";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Wallet, Percent, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const stats = await getDashboardStats();
  const margin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;

  // Profit by product (aggregated from order items)
  const items = await prisma.orderItem.findMany({
    include: { order: { select: { status: true } } },
  });
  const byProduct = new Map<string, { name: string; revenue: number; cost: number; profit: number; quantity: number }>();
  for (const i of items) {
    if (i.order.status === "CANCELLED") continue;
    const e = byProduct.get(i.productId) || { name: i.productName, revenue: 0, cost: 0, profit: 0, quantity: 0 };
    e.revenue += i.salePrice * i.quantity;
    e.cost += i.costPrice * i.quantity;
    e.profit += (i.salePrice - i.costPrice) * i.quantity;
    e.quantity += i.quantity;
    byProduct.set(i.productId, e);
  }
  const top = Array.from(byProduct.values()).sort((a, b) => b.profit - a.profit).slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finances"
        description="Analyse complète de votre rentabilité"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Chiffre d'affaires" value={formatCurrency(stats.totalRevenue)} icon={Wallet} />
        <StatCard label="Bénéfice net" value={formatCurrency(stats.totalProfit)} icon={TrendingUp} />
        <StatCard label="Marge moyenne" value={`${margin.toFixed(1)}%`} icon={Percent} />
        <StatCard
          label="Meilleur produit"
          value={top[0]?.name?.slice(0, 18) || "—"}
          hint={top[0] ? formatCurrency(top[0].profit) : undefined}
          icon={Trophy}
        />
      </div>

      <MonthlyRevenueChart data={stats.monthly} />

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Bénéfice par produit (Top 10)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Produit</th>
                <th className="py-3 px-5 font-medium">Qté vendue</th>
                <th className="py-3 px-5 font-medium">CA</th>
                <th className="py-3 px-5 font-medium">Coût</th>
                <th className="py-3 px-5 font-medium">Bénéfice</th>
                <th className="py-3 px-5 font-medium">Marge</th>
              </tr>
            </thead>
            <tbody>
              {top.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    Pas encore de données.
                  </td>
                </tr>
              )}
              {top.map((p, i) => {
                const m = p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0;
                return (
                  <tr key={i} className="border-t border-border/60 table-row-hover">
                    <td className="py-3 px-5 font-medium">{p.name}</td>
                    <td className="py-3 px-5">{p.quantity}</td>
                    <td className="py-3 px-5">{formatCurrency(p.revenue)}</td>
                    <td className="py-3 px-5">{formatCurrency(p.cost)}</td>
                    <td className="py-3 px-5 text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.profit)}
                    </td>
                    <td className="py-3 px-5">{m.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
