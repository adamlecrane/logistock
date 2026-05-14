import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { InvoicesTable } from "./_table";
import { CheckCircle2, Clock, FileText, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { reference: true } } },
  });

  const totalAll = invoices.reduce((s, i) => s + i.amountTTC, 0);
  const totalPaid = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amountTTC, 0);
  const totalDue = invoices.filter((i) => i.status === "ISSUED").reduce((s, i) => s + i.amountTTC, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Factures"
        description={`${invoices.length} facture${invoices.length > 1 ? "s" : ""} — générées automatiquement à chaque commande`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total facturé" value={formatCurrency(totalAll)} icon={FileText} />
        <StatCard label="Encaissé" value={formatCurrency(totalPaid)} icon={CheckCircle2} />
        <StatCard label="En attente" value={formatCurrency(totalDue)} icon={Clock} />
        <StatCard
          label="Annulées"
          value={invoices.filter((i) => i.status === "CANCELLED").length}
          icon={XCircle}
        />
      </div>

      <InvoicesTable
        invoices={invoices.map((i) => ({
          ...i,
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString(),
          paidAt: i.paidAt?.toISOString() ?? null,
          dueDate: i.dueDate?.toISOString() ?? null,
          orderReference: i.order?.reference ?? null,
        }))}
      />
    </div>
  );
}
