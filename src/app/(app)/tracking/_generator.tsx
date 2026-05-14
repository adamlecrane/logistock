"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import { Copy, ExternalLink, Mail, MessageCircle } from "lucide-react";
import { CARRIERS, buildClientMessage, buildTrackingUrl, formatDate } from "@/lib/utils";

type RecentOrder = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  trackingUrl: string | null;
  updatedAt: Date;
};

export function TrackingGenerator({ recentOrders }: { recentOrders: RecentOrder[] }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [carrier, setCarrier] = useState("COLISSIMO");
  const [tracking, setTracking] = useState("");

  const url = buildTrackingUrl(carrier, tracking);
  const message = url ? buildClientMessage({ customerName: name || "Client", trackingUrl: url }) : "";

  function copy(text: string, label = "Copié") {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(label);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold">Générateur</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-2">
            <label className="label">Nom client</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="label">Email</label>
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="label">Téléphone (WhatsApp)</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33..." />
          </div>
          <div className="space-y-2">
            <label className="label">Transporteur</label>
            <select className="input" value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              {CARRIERS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="label">N° de suivi</label>
            <input className="input" value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </div>
        </div>

        {url && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="space-y-2">
              <label className="label">Lien de suivi</label>
              <div className="flex gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="input flex items-center gap-2 truncate font-mono text-xs">
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="truncate">{url}</span>
                </a>
                <button onClick={() => copy(url, "Lien copié")} className="btn-secondary">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold">Message client</h3>
        <textarea
          readOnly
          rows={9}
          className="input min-h-[200px] font-mono text-xs"
          value={message || "Saisissez les informations à gauche pour générer le message…"}
        />
        <div className="grid grid-cols-3 gap-2">
          <button disabled={!message} onClick={() => copy(message, "Message copié")} className="btn-secondary">
            <Copy className="h-4 w-4" /> Copier
          </button>
          {message && phone ? (
            <a
              href={`https://wa.me/${phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`}
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
          {message && email ? (
            <a
              href={`mailto:${email}?subject=${encodeURIComponent("Suivi de votre commande")}&body=${encodeURIComponent(message)}`}
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

      <div className="card lg:col-span-2 overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Suivis récents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Commande</th>
                <th className="py-3 px-5 font-medium">Client</th>
                <th className="py-3 px-5 font-medium">Transporteur</th>
                <th className="py-3 px-5 font-medium">Numéro</th>
                <th className="py-3 px-5 font-medium">Mis à jour</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun suivi récent.
                  </td>
                </tr>
              )}
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-t border-border/60 table-row-hover">
                  <td className="py-3 px-5 font-medium">
                    <Link href={`/orders/${o.id}`} className="hover:underline">{o.reference}</Link>
                  </td>
                  <td className="py-3 px-5">{o.customerName}</td>
                  <td className="py-3 px-5">{o.carrier || "—"}</td>
                  <td className="py-3 px-5 font-mono text-xs">{o.trackingNumber}</td>
                  <td className="py-3 px-5 text-muted-foreground">{formatDate(o.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
