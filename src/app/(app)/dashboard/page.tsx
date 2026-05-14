import Link from "next/link";
import {
  ShoppingCart,
  TrendingUp,
  Truck,
  Package,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/badge";
import { MonthlyRevenueChart, MonthlyOrdersChart } from "@/components/charts";
import { getDashboardStats } from "@/lib/stats";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const s = await getDashboardStats();
  const margin = s.totalRevenue > 0 ? (s.totalProfit / s.totalRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de votre activité"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Chiffre d'affaires"
          value={formatCurrency(s.totalRevenue)}
          icon={Wallet}
          hint="Toutes commandes non annulées"
        />
        <StatCard
          label="Bénéfice net"
          value={formatCurrency(s.totalProfit)}
          icon={TrendingUp}
          hint={`Marge ${margin.toFixed(1)}%`}
        />
        <StatCard
          label="Commandes"
          value={s.ordersCount}
          icon={ShoppingCart}
          hint={`${s.shippedCount} expédiées`}
        />
        <StatCard
          label="Stock total"
          value={s.stockTotal}
          icon={Package}
          hint="Unités disponibles"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MonthlyRevenueChart data={s.monthly} />
        <MonthlyOrdersChart data={s.monthly} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="font-semibold">Commandes récentes</h3>
            <p className="text-xs text-muted-foreground">Les 8 dernières</p>
          </div>
          <Link href="/orders" className="btn-ghost text-sm">
            Voir tout <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-3 px-5 font-medium">Référence</th>
                <th className="py-3 px-5 font-medium">Client</th>
                <th className="py-3 px-5 font-medium">Statut</th>
                <th className="py-3 px-5 font-medium">Total</th>
                <th className="py-3 px-5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {s.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucune commande pour le moment.
                  </td>
                </tr>
              )}
              {s.recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-border/60 table-row-hover">
                  <td className="py-3 px-5 font-medium">
                    <Link href={`/orders/${o.id}`} className="hover:underline">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="py-3 px-5">{o.customerName}</td>
                  <td className="py-3 px-5"><StatusBadge status={o.status} /></td>
                  <td className="py-3 px-5">{formatCurrency(o.totalRevenue)}</td>
                  <td className="py-3 px-5 text-muted-foreground">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
