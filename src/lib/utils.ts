import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export const ORDER_STATUSES = [
  { value: "PENDING", label: "En attente", color: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30" },
  { value: "PREPARING", label: "Préparation", color: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30" },
  { value: "SHIPPED", label: "Expédiée", color: "bg-violet-500/15 text-violet-600 dark:text-violet-400 ring-violet-500/30" },
  { value: "DELIVERED", label: "Livrée", color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30" },
  { value: "CANCELLED", label: "Annulée", color: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["value"];

export function getStatusMeta(status: string) {
  return ORDER_STATUSES.find((s) => s.value === status) ?? ORDER_STATUSES[0];
}

export const CARRIERS = [
  { value: "COLISSIMO", label: "Colissimo", urlTemplate: "https://www.laposte.fr/outils/suivre-vos-envois?code={tracking}" },
  { value: "CHRONOPOST", label: "Chronopost", urlTemplate: "https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT={tracking}" },
  { value: "MONDIAL_RELAY", label: "Mondial Relay", urlTemplate: "https://www.mondialrelay.fr/suivi-de-colis?numeroExpedition={tracking}" },
  { value: "DHL", label: "DHL", urlTemplate: "https://www.dhl.com/fr-fr/home/tracking.html?tracking-id={tracking}" },
  { value: "UPS", label: "UPS", urlTemplate: "https://www.ups.com/track?tracknum={tracking}" },
  { value: "FEDEX", label: "FedEx", urlTemplate: "https://www.fedex.com/fedextrack/?trknbr={tracking}" },
  { value: "DPD", label: "DPD", urlTemplate: "https://www.dpd.fr/trace/{tracking}" },
  { value: "GLS", label: "GLS", urlTemplate: "https://gls-group.eu/FR/fr/suivi-colis?match={tracking}" },
  { value: "OTHER", label: "Autre", urlTemplate: "https://suivi.exemple.com/{tracking}" },
] as const;

export function buildTrackingUrl(carrier: string | null | undefined, trackingNumber: string | null | undefined) {
  if (!trackingNumber) return null;
  const c = CARRIERS.find((x) => x.value === carrier) ?? CARRIERS[CARRIERS.length - 1];
  return c.urlTemplate.replace("{tracking}", encodeURIComponent(trackingNumber));
}

export function buildClientMessage(opts: {
  customerName: string;
  trackingUrl: string;
  shopName?: string;
}) {
  return `Bonjour ${opts.customerName},\n\nVotre commande a été expédiée.\n\nVoici votre lien de suivi :\n${opts.trackingUrl}\n\nMerci pour votre confiance${opts.shopName ? `,\n${opts.shopName}` : "."}`;
}

export function generateOrderReference() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CMD-${y}${m}${day}-${rand}`;
}
