"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { CheckCircle2, FileText, Printer, RotateCcw, Search, XCircle } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Invoice = {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string | null;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  currency: string;
  status: string;
  paidAt: string | null;
  dueDate: string | null;
  createdAt: string;
  orderReference: string | null;
};

const STATUSES = [
  { value: "ISSUED", label: "À régler", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30", icon: FileText },
  { value: "PAID", label: "Payée", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30", icon: CheckCircle2 },
  { value: "CANCELLED", label: "Annulée", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30", icon: XCircle },
];

export function InvoicesTable({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (statusFilter !== "ALL" && i.status !== statusFilter) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (
        i.number.toLowerCase().includes(s) ||
        i.customerName.toLowerCase().includes(s) ||
        (i.customerEmail || "").toLowerCase().includes(s) ||
        (i.orderReference || "").toLowerCase().includes(s)
      );
    });
  }, [invoices, q, statusFilter]);

  async function setStatus(id: string, status: string) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) return toast.error("Erreur");
    toast.success("Facture mise à jour");
    router.refresh();
  }

  return (
    <>
      <div className="card p-3 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (numéro, client, commande)..."
            className="input pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-56"
        >
          <option value="ALL">Tous les statuts</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">N° Facture</th>
                <th className="py-3 px-5 font-medium">Client</th>
                <th className="py-3 px-5 font-medium">Commande</th>
                <th className="py-3 px-5 font-medium">Montant TTC</th>
                <th className="py-3 px-5 font-medium">Statut</th>
                <th className="py-3 px-5 font-medium">Émise</th>
                <th className="py-3 px-5 font-medium">Échéance</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    Aucune facture.
                  </td>
                </tr>
              )}
              {filtered.map((i) => {
                const st = STATUSES.find((x) => x.value === i.status) ?? STATUSES[0];
                const StIcon = st.icon;
                return (
                  <tr key={i.id} className="border-t border-border/60 table-row-hover">
                    <td className="py-3 px-5 font-mono font-semibold">{i.number}</td>
                    <td className="py-3 px-5">
                      <div className="font-medium">{i.customerName}</div>
                      {i.customerEmail && <div className="text-xs text-muted-foreground">{i.customerEmail}</div>}
                    </td>
                    <td className="py-3 px-5 text-muted-foreground text-xs">{i.orderReference || "—"}</td>
                    <td className="py-3 px-5 font-semibold">{formatCurrency(i.amountTTC, i.currency)}</td>
                    <td className="py-3 px-5">
                      <span className={cn("badge ring-1", st.className)}>
                        <StIcon className="h-3 w-3 mr-1" /> {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">{formatDate(i.createdAt)}</td>
                    <td className="py-3 px-5 text-muted-foreground">{i.dueDate ? formatDate(i.dueDate) : "—"}</td>
                    <td className="py-3 px-5 text-right whitespace-nowrap">
                      <a
                        href={`/api/invoices/${i.id}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-icon"
                        aria-label="PDF"
                        title="Télécharger PDF"
                      >
                        <Printer className="h-4 w-4" />
                      </a>
                      {i.status === "ISSUED" && (
                        <button
                          onClick={() => setStatus(i.id, "PAID")}
                          className="btn-icon text-emerald-600 hover:bg-emerald-500/10"
                          aria-label="Marquer payée"
                          title="Marquer payée"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {i.status === "PAID" && (
                        <button
                          onClick={() => setStatus(i.id, "ISSUED")}
                          className="btn-icon"
                          aria-label="Annuler le paiement"
                          title="Annuler le paiement"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
