import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [
    totalRevenue,
    totalProfit,
    ordersCount,
    shippedCount,
    products,
    recentOrders,
  ] = await Promise.all([
    prisma.order.aggregate({
      _sum: { totalRevenue: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.order.aggregate({
      _sum: { totalProfit: true },
      where: { status: { not: "CANCELLED" } },
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["SHIPPED", "DELIVERED"] } } }),
    prisma.product.aggregate({ _sum: { quantity: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { items: true },
    }),
  ]);

  // Monthly series — last 12 months
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
    select: { createdAt: true, totalRevenue: true, totalProfit: true },
  });

  const buckets = new Map<string, { revenue: number; profit: number; orders: number }>();
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(since);
    d.setMonth(since.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push(key);
    buckets.set(key, { revenue: 0, profit: 0, orders: 0 });
  }
  for (const o of orders) {
    const key = `${o.createdAt.getFullYear()}-${String(o.createdAt.getMonth() + 1).padStart(2, "0")}`;
    const b = buckets.get(key);
    if (b) {
      b.revenue += o.totalRevenue;
      b.profit += o.totalProfit;
      b.orders += 1;
    }
  }
  const monthlyLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const monthly = months.map((key) => {
    const [, m] = key.split("-");
    const b = buckets.get(key)!;
    return { month: monthlyLabels[parseInt(m) - 1], ...b };
  });

  return {
    totalRevenue: totalRevenue._sum.totalRevenue || 0,
    totalProfit: totalProfit._sum.totalProfit || 0,
    ordersCount,
    shippedCount,
    stockTotal: products._sum.quantity || 0,
    recentOrders,
    monthly,
  };
}
