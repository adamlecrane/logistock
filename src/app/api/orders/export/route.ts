import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const headers = [
    "Référence",
    "Date",
    "Client",
    "Email",
    "Téléphone",
    "Adresse",
    "Statut",
    "Transporteur",
    "Numéro de suivi",
    "CA",
    "Coût produits",
    "Coût expédition",
    "Bénéfice",
    "Articles",
  ];
  const rows = orders.map((o) => [
    o.reference,
    o.createdAt.toISOString(),
    o.customerName,
    o.customerEmail || "",
    o.customerPhone || "",
    (o.customerAddress || "").replace(/\n/g, " "),
    o.status,
    o.carrier || "",
    o.trackingNumber || "",
    o.totalRevenue.toFixed(2),
    o.totalCost.toFixed(2),
    o.shippingCost.toFixed(2),
    o.totalProfit.toFixed(2),
    o.items.map((i) => `${i.productName} x${i.quantity}`).join(" | "),
  ]);

  const escape = (v: string) =>
    /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => escape(String(c))).join(","))
    .join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="commandes-${Date.now()}.csv"`,
    },
  });
}
