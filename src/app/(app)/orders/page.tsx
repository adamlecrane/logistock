import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Download, Plus, Search } from "lucide-react";
import { OrdersFilters } from "./_filters";
import { AlphabetBar } from "./_alphabet";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; page?: string; letter?: string };
}) {
  const q = searchParams.q?.trim();
  const status = searchParams.status && searchParams.status !== "ALL" ? searchParams.status : undefined;
  const letter = searchParams.letter?.toUpperCase();
  const page = Math.max(1, parseInt(searchParams.page || "1"));

  const where: any = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { reference: { contains: q } },
      { customerName: { contains: q } },
      { customerEmail: { contains: q } },
      { trackingNumber: { contains: q } },
    ];
  }
  if (letter) {
    if (letter === "#") {
      // Names starting with a digit or non-letter
      where.AND = [
        ...(where.AND ?? []),
        { NOT: { customerName: { startsWith: "A" } } },
        { NOT: { customerName: { startsWith: "B" } } },
        { NOT: { customerName: { startsWith: "C" } } },
        { NOT: { customerName: { startsWith: "D" } } },
        { NOT: { customerName: { startsWith: "E" } } },
        { NOT: { customerName: { startsWith: "F" } } },
        { NOT: { customerName: { startsWith: "G" } } },
        { NOT: { customerName: { startsWith: "H" } } },
        { NOT: { customerName: { startsWith: "I" } } },
        { NOT: { customerName: { startsWith: "J" } } },
        { NOT: { customerName: { startsWith: "K" } } },
        { NOT: { customerName: { startsWith: "L" } } },
        { NOT: { customerName: { startsWith: "M" } } },
        { NOT: { customerName: { startsWith: "N" } } },
        { NOT: { customerName: { startsWith: "O" } } },
        { NOT: { customerName: { startsWith: "P" } } },
        { NOT: { customerName: { startsWith: "Q" } } },
        { NOT: { customerName: { startsWith: "R" } } },
        { NOT: { customerName: { startsWith: "S" } } },
        { NOT: { customerName: { startsWith: "T" } } },
        { NOT: { customerName: { startsWith: "U" } } },
        { NOT: { customerName: { startsWith: "V" } } },
        { NOT: { customerName: { startsWith: "W" } } },
        { NOT: { customerName: { startsWith: "X" } } },
        { NOT: { customerName: { startsWith: "Y" } } },
        { NOT: { customerName: { startsWith: "Z" } } },
      ];
    } else if (/^[A-Z]$/.test(letter)) {
      where.OR = [
        ...(where.OR ?? []),
        { customerName: { startsWith: letter } },
        { customerName: { startsWith: letter.toLowerCase() } },
      ];
    }
  }

  const orderBy = letter
    ? ({ customerName: "asc" } as const)
    : ({ createdAt: "desc" } as const);

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commandes"
        description={`${total} commande${total > 1 ? "s" : ""} au total`}
        action={
          <>
            <a href="/api/orders/export" className="btn-secondary">
              <Download className="h-4 w-4" /> Export CSV
            </a>
            <Link href="/orders/new" className="btn-primary">
              <Plus className="h-4 w-4" /> Nouvelle commande
            </Link>
          </>
        }
      />

      <OrdersFilters defaultQ={q || ""} defaultStatus={status || "ALL"} />

      <AlphabetBar active={letter} />

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Référence</th>
                <th className="py-3 px-5 font-medium">Client</th>
                <th className="py-3 px-5 font-medium">Statut</th>
                <th className="py-3 px-5 font-medium">CA</th>
                <th className="py-3 px-5 font-medium">Bénéfice</th>
                <th className="py-3 px-5 font-medium">Suivi</th>
                <th className="py-3 px-5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <Search className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    Aucune commande trouvée.
                  </td>
                </tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border/60 table-row-hover">
                  <td className="py-3 px-5 font-medium">
                    <Link href={`/orders/${o.id}`} className="hover:underline">
                      {o.reference}
                    </Link>
                  </td>
                  <td className="py-3 px-5">
                    <div className="font-medium">{o.customerName}</div>
                    {o.customerEmail && (
                      <div className="text-xs text-muted-foreground">{o.customerEmail}</div>
                    )}
                  </td>
                  <td className="py-3 px-5"><StatusBadge status={o.status} /></td>
                  <td className="py-3 px-5">{formatCurrency(o.totalRevenue)}</td>
                  <td className="py-3 px-5 text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(o.totalProfit)}
                  </td>
                  <td className="py-3 px-5 text-xs">
                    {o.trackingNumber ? (
                      <span className="font-mono">{o.trackingNumber}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-muted-foreground">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border text-sm">
            <span className="text-muted-foreground">
              Page {page} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <Link
                href={{
                  pathname: "/orders",
                  query: { ...searchParams, page: Math.max(1, page - 1) },
                }}
                className="btn-secondary"
              >
                Précédent
              </Link>
              <Link
                href={{
                  pathname: "/orders",
                  query: { ...searchParams, page: Math.min(totalPages, page + 1) },
                }}
                className="btn-secondary"
              >
                Suivant
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
