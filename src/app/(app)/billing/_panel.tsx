"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Check, CreditCard, Crown, Loader2, ShieldCheck } from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const PLAN_PRICE = 9.99;

const FEATURES = [
  "Commandes illimitées",
  "Stock & inventaire complet",
  "Suivi colis automatique",
  "Génération de messages WhatsApp / Email",
  "Convertisseur de monnaie en temps réel",
  "Gestion des abonnements clients",
  "Tableau de bord & statistiques avancées",
  "Export CSV & factures PDF",
  "Multi-utilisateurs",
  "Support prioritaire",
];

type Props = {
  user: {
    name: string;
    email: string;
    role: string;
    planStatus: string;
    planExpiresAt: string | null;
    trialEndsAt: string | null;
    lastPaymentAt: string | null;
  };
  state: {
    status: string;
    hasAccess: boolean;
    daysLeft: number;
    isTrial: boolean;
  };
  payments: { id: string; amount: number; currency: string; status: string; reference: string | null; createdAt: string }[];
};

export function BillingPanel({ user, state, payments }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    setLoading(true);
    const res = await fetch("/api/billing/subscribe", { method: "POST" });
    setLoading(false);
    if (!res.ok) return toast.error("Erreur lors du paiement");
    toast.success("Abonnement activé pour 30 jours ✓");
    router.refresh();
  }

  async function cancel() {
    if (!confirm("Annuler le renouvellement automatique ? Vous gardez l'accès jusqu'à la date d'expiration.")) return;
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    if (!res.ok) return toast.error("Erreur");
    toast.success("Renouvellement annulé");
    router.refresh();
  }

  const statusBadge =
    state.status === "ACTIVE"
      ? { label: "Actif", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30" }
      : state.status === "TRIAL"
      ? { label: `Essai gratuit · ${state.daysLeft}j restants`, className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30" }
      : state.status === "CANCELLED"
      ? { label: `Annulé · accès jusqu'au ${user.planExpiresAt ? formatDate(user.planExpiresAt) : ""}`, className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30" }
      : { label: "Expiré", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30" };

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-4 border-l-primary">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("badge ring-1", statusBadge.className)}>{statusBadge.label}</span>
            {user.role === "OWNER" && (
              <span className="badge bg-primary/10 text-primary ring-primary/30">
                <Crown className="h-3 w-3 mr-1" /> Propriétaire
              </span>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {state.status === "TRIAL" && "Profitez de votre période d'essai pour découvrir toutes les fonctionnalités."}
            {state.status === "ACTIVE" && user.planExpiresAt && (
              <>Prochaine facturation le <strong className="text-foreground">{formatDate(user.planExpiresAt)}</strong></>
            )}
            {state.status === "EXPIRED" && "Votre accès est suspendu. Souscrivez pour continuer à utiliser l'application."}
          </div>
        </div>
        {state.status === "ACTIVE" && (
          <button onClick={cancel} className="btn-secondary">Annuler le renouvellement</button>
        )}
      </div>

      {/* Plan card */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="card p-8 relative overflow-hidden bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/40">
          <div
            aria-hidden
            className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
              <ShieldCheck className="h-4 w-4" />
              Plan LOGISTOCK
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-black tracking-tight">{PLAN_PRICE.toFixed(2)}</span>
              <span className="text-2xl font-bold text-primary">€</span>
              <span className="text-sm text-muted-foreground ml-1">/ mois</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Tout inclus, sans engagement. Annulable à tout moment.
            </p>

            <div className="mt-6 space-y-3">
              {state.hasAccess && state.status !== "EXPIRED" ? (
                <button
                  onClick={subscribe}
                  disabled={loading}
                  className="btn-primary w-full text-base font-semibold h-12"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      {state.status === "ACTIVE" ? "Renouveler maintenant" : "Activer l'abonnement"}
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={subscribe}
                  disabled={loading}
                  className="btn-primary w-full text-base font-semibold h-12 animate-pulse"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Souscrire — {PLAN_PRICE.toFixed(2)} €
                    </>
                  )}
                </button>
              )}
              <p className="text-xs text-muted-foreground text-center">
                🔒 Paiement sécurisé · Activation immédiate
              </p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="card p-6">
          <h3 className="font-semibold mb-4">Fonctionnalités incluses</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary mt-0.5 shrink-0">
                  <Check className="h-3 w-3" />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Payment history */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Historique des paiements</h3>
            <p className="text-xs text-muted-foreground">Vos derniers règlements</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Date</th>
                <th className="py-3 px-5 font-medium">Référence</th>
                <th className="py-3 px-5 font-medium">Montant</th>
                <th className="py-3 px-5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-muted-foreground">
                    Aucun paiement encore.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-border/60 table-row-hover">
                  <td className="py-3 px-5 text-muted-foreground">{formatDate(p.createdAt)}</td>
                  <td className="py-3 px-5 font-mono text-xs">{p.reference}</td>
                  <td className="py-3 px-5 font-semibold">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="py-3 px-5">
                    <span className="badge bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30">
                      {p.status === "PAID" ? "Payé" : p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
