"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Ghost,
  Mail,
  MessageCircle,
  Save,
  Trash2,
  Printer,
} from "lucide-react";
import {
  CARRIERS,
  ORDER_STATUSES,
  buildClientMessage,
  buildTrackingUrl,
  formatCurrency,
  formatDateTime,
} from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { ShippingConverter } from "@/components/shipping-converter";

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  salePrice: number;
  costPrice: number;
};
type Order = {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  customerAddress: string | null;
  customerSnapchat: string | null;
  status: string;
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  notes: string | null;
  totalRevenue: number;
  totalCost: number;
  shippingCost: number;
  totalProfit: number;
  createdAt: Date;
  items: OrderItem[];
};

type InvoiceLite = { id: string; number: string; status: string } | null;

export function OrderDetail({ order, invoice }: { order: Order; invoice?: InvoiceLite }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: order.customerName,
    customerEmail: order.customerEmail || "",
    customerPhone: order.customerPhone || "",
    customerAddress: order.customerAddress || "",
    customerSnapchat: order.customerSnapchat || "",
    status: order.status,
    trackingNumber: order.trackingNumber || "",
    carrier: order.carrier || "",
    shippingCost: order.shippingCost || 0,
    notes: order.notes || "",
  });

  const trackingUrl = buildTrackingUrl(form.carrier, form.trackingNumber);
  const clientMessage = trackingUrl
    ? buildClientMessage({ customerName: form.customerName || order.customerName, trackingUrl })
    : "";

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("Erreur lors de la sauvegarde");
      return;
    }
    toast.success("Commande mise à jour");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Supprimer cette commande ? Le stock sera restitué si non annulée.")) return;
    const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Erreur");
    toast.success("Commande supprimée");
    router.push("/orders");
    router.refresh();
  }

  function copy(text: string, label = "Copié") {
    navigator.clipboard.writeText(text);
    toast.success(label);
  }

  function whatsappLink(phone: string, text: string) {
    const clean = phone.replace(/[^\d+]/g, "");
    return `https://wa.me/${clean.replace(/^\+/, "")}?text=${encodeURIComponent(text)}`;
  }

  function mailto(email: string, subject: string, body: string) {
    return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={`Commande ${order.reference}`}
        description={`Créée le ${formatDateTime(order.createdAt)}`}
        action={
          <>
            <Link href="/orders" className="btn-ghost">
              <ArrowLeft className="h-4 w-4" /> Retour
            </Link>
            {invoice ? (
              <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" className="btn-secondary">
                <Printer className="h-4 w-4" /> {invoice.number}
              </a>
            ) : (
              <a href={`/api/orders/${order.id}/invoice`} target="_blank" className="btn-secondary">
                <Printer className="h-4 w-4" /> Facture
              </a>
            )}
            <button onClick={remove} className="btn-destructive">
              <Trash2 className="h-4 w-4" /> Supprimer
            </button>
          </>
        }
      />

      <div className="flex items-center gap-3">
        <StatusBadge status={form.status} />
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm font-medium">{formatCurrency(order.totalRevenue)}</span>
        <span className="text-sm text-muted-foreground">·</span>
        <span className="text-sm text-emerald-600 dark:text-emerald-400">
          {formatCurrency(order.totalProfit)} bénéfice
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold">Informations client</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label">Nom</label>
              <input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="label">Statut</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="label">Téléphone</label>
              <input className="input" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="label">Adresse</label>
              <textarea rows={2} className="input min-h-[64px]" value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="label">Snapchat</label>
              <div className="flex gap-2">
                <input
                  className="input"
                  placeholder="@pseudo"
                  value={form.customerSnapchat}
                  onChange={(e) => setForm({ ...form, customerSnapchat: e.target.value })}
                />
                {form.customerSnapchat ? (
                  <a
                    href={`https://www.snapchat.com/add/${form.customerSnapchat.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary bg-yellow-400/10 text-yellow-600 dark:text-yellow-400 shrink-0"
                  >
                    <Ghost className="h-4 w-4" /> Ouvrir
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label">Transporteur</label>
              <select className="input" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })}>
                <option value="">—</option>
                {CARRIERS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="label">N° de suivi</label>
              <input className="input" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="label">Coût d'expédition (€)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                className="input"
                value={form.shippingCost}
                onChange={(e) => setForm({ ...form, shippingCost: parseFloat(e.target.value) || 0 })}
              />
              <ShippingConverter
                onConvert={(eur) => setForm({ ...form, shippingCost: eur })}
              />
            </div>
            <div className="space-y-2 col-span-2">
              <label className="label">Notes internes</label>
              <textarea rows={2} className="input min-h-[64px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="btn-primary">
              <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-semibold">Suivi colis</h3>
          {trackingUrl ? (
            <>
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm hover:bg-muted/60 transition"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate font-mono text-xs">{trackingUrl}</span>
              </a>
              <div className="flex gap-2">
                <button onClick={() => copy(trackingUrl, "Lien copié")} className="btn-secondary flex-1">
                  <Copy className="h-4 w-4" /> Copier le lien
                </button>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <label className="label">Message client</label>
                <textarea
                  readOnly
                  rows={6}
                  value={clientMessage}
                  className="input min-h-[140px] font-mono text-xs"
                />
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => copy(clientMessage, "Message copié")} className="btn-secondary">
                    <Copy className="h-4 w-4" /> Copier
                  </button>
                  {form.customerPhone ? (
                    <a
                      href={whatsappLink(form.customerPhone, clientMessage)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  ) : (
                    <button disabled className="btn-secondary opacity-50">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </button>
                  )}
                  {form.customerEmail ? (
                    <a
                      href={mailto(form.customerEmail, `Suivi de votre commande ${order.reference}`, clientMessage)}
                      className="btn-secondary bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    >
                      <Mail className="h-4 w-4" /> Email
                    </a>
                  ) : (
                    <button disabled className="btn-secondary opacity-50">
                      <Mail className="h-4 w-4" /> Email
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Renseignez le transporteur et le numéro de suivi pour générer le lien et le message client.
            </p>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Articles</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Produit</th>
                <th className="py-3 px-5 font-medium">Qté</th>
                <th className="py-3 px-5 font-medium">PV unitaire</th>
                <th className="py-3 px-5 font-medium">Coût unitaire</th>
                <th className="py-3 px-5 font-medium">Sous-total</th>
                <th className="py-3 px-5 font-medium">Bénéfice</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((it) => (
                <tr key={it.id} className="border-t border-border/60">
                  <td className="py-3 px-5 font-medium">{it.productName}</td>
                  <td className="py-3 px-5">{it.quantity}</td>
                  <td className="py-3 px-5">{formatCurrency(it.salePrice)}</td>
                  <td className="py-3 px-5">{formatCurrency(it.costPrice)}</td>
                  <td className="py-3 px-5">{formatCurrency(it.salePrice * it.quantity)}</td>
                  <td className="py-3 px-5 text-emerald-600 dark:text-emerald-400">
                    {formatCurrency((it.salePrice - it.costPrice) * it.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/20">
                <td colSpan={4} className="py-3 px-5 text-right text-muted-foreground">Coût expédition</td>
                <td className="py-3 px-5">—</td>
                <td className="py-3 px-5 text-rose-500">- {formatCurrency(order.shippingCost)}</td>
              </tr>
              <tr className="border-t border-border bg-muted/30">
                <td colSpan={4} className="py-3 px-5 text-right font-medium">Totaux</td>
                <td className="py-3 px-5 font-semibold">{formatCurrency(order.totalRevenue)}</td>
                <td className="py-3 px-5 font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(order.totalProfit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
