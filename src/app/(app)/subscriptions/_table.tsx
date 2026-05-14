"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Edit3, Plus, Trash2, X } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type Sub = {
  id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  plan: string;
  amount: number;
  currency: string;
  frequency: string;
  status: string;
  startDate: string;
  nextBillingDate: string | null;
  notes: string | null;
};

const PLANS = ["BASIC", "PRO", "PREMIUM", "CUSTOM"];
const STATUSES = [
  { value: "ACTIVE", label: "Actif", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30" },
  { value: "PAUSED", label: "En pause", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30" },
  { value: "CANCELLED", label: "Annulé", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30" },
];

const empty: Partial<Sub> = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  plan: "BASIC",
  amount: 9.99,
  currency: "EUR",
  frequency: "MONTHLY",
  status: "ACTIVE",
  notes: "",
};

export function SubscriptionsTable({ subscriptions }: { subscriptions: Sub[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Sub> | null>(null);

  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    const payload = {
      customerName: editing.customerName,
      customerEmail: editing.customerEmail,
      customerPhone: editing.customerPhone,
      plan: editing.plan,
      amount: Number(editing.amount) || 0,
      currency: editing.currency || "EUR",
      frequency: editing.frequency || "MONTHLY",
      status: editing.status || "ACTIVE",
      notes: editing.notes,
    };
    const res = await fetch(isNew ? "/api/subscriptions" : `/api/subscriptions/${editing.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return toast.error(j?.error?.toString?.() || "Erreur");
    }
    toast.success(isNew ? "Abonnement créé" : "Abonnement mis à jour");
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cet abonnement ?")) return;
    const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Erreur");
    toast.success("Abonnement supprimé");
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setEditing({ ...empty })} className="btn-primary">
          <Plus className="h-4 w-4" /> Nouvel abonnement
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Client</th>
                <th className="py-3 px-5 font-medium">Plan</th>
                <th className="py-3 px-5 font-medium">Montant</th>
                <th className="py-3 px-5 font-medium">Fréquence</th>
                <th className="py-3 px-5 font-medium">Statut</th>
                <th className="py-3 px-5 font-medium">Prochaine facturation</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun abonnement.
                  </td>
                </tr>
              )}
              {subscriptions.map((s) => {
                const st = STATUSES.find((x) => x.value === s.status) ?? STATUSES[0];
                return (
                  <tr key={s.id} className="border-t border-border/60 table-row-hover">
                    <td className="py-3 px-5">
                      <div className="font-medium">{s.customerName}</div>
                      {s.customerEmail && <div className="text-xs text-muted-foreground">{s.customerEmail}</div>}
                    </td>
                    <td className="py-3 px-5">
                      <span className="badge bg-primary/10 text-primary ring-primary/30">{s.plan}</span>
                    </td>
                    <td className="py-3 px-5 font-semibold">{formatCurrency(s.amount, s.currency)}</td>
                    <td className="py-3 px-5">{s.frequency === "MONTHLY" ? "Mensuel" : "Annuel"}</td>
                    <td className="py-3 px-5">
                      <span className={cn("badge ring-1", st.className)}>{st.label}</span>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">
                      {s.nextBillingDate ? formatDate(s.nextBillingDate) : "—"}
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => setEditing(s)} className="btn-icon" aria-label="Modifier">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(s.id)} className="btn-icon text-rose-500 hover:bg-rose-500/10" aria-label="Supprimer">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-2xl card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing.id ? "Modifier" : "Nouvel"} abonnement</h3>
              <button onClick={() => setEditing(null)} className="btn-icon"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-2">
                <label className="label">Nom client *</label>
                <input className="input" value={editing.customerName || ""} onChange={(e) => setEditing({ ...editing, customerName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="label">Email</label>
                <input type="email" className="input" value={editing.customerEmail || ""} onChange={(e) => setEditing({ ...editing, customerEmail: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="label">Téléphone</label>
                <input className="input" value={editing.customerPhone || ""} onChange={(e) => setEditing({ ...editing, customerPhone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="label">Plan</label>
                <select className="input" value={editing.plan || "BASIC"} onChange={(e) => setEditing({ ...editing, plan: e.target.value })}>
                  {PLANS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Montant</label>
                <input type="number" step="0.01" min={0} className="input" value={editing.amount ?? 0} onChange={(e) => setEditing({ ...editing, amount: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <label className="label">Devise</label>
                <select className="input" value={editing.currency || "EUR"} onChange={(e) => setEditing({ ...editing, currency: e.target.value })}>
                  <option value="EUR">EUR €</option>
                  <option value="USD">USD $</option>
                  <option value="GBP">GBP £</option>
                  <option value="CHF">CHF</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Fréquence</label>
                <select className="input" value={editing.frequency || "MONTHLY"} onChange={(e) => setEditing({ ...editing, frequency: e.target.value })}>
                  <option value="MONTHLY">Mensuel</option>
                  <option value="YEARLY">Annuel</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="label">Statut</label>
                <select className="input" value={editing.status || "ACTIVE"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-2">
                <label className="label">Notes</label>
                <textarea rows={2} className="input min-h-[60px]" value={editing.notes || ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="btn-secondary">Annuler</button>
              <button onClick={save} className="btn-primary">{editing.id ? "Enregistrer" : "Créer"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
