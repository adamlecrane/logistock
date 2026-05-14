"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { CARRIERS, ORDER_STATUSES, formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";

type PriceTier = { minQty: number; price: number };

type Product = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  unlimitedStock?: boolean;
  costPrice: number;
  salePrice: number;
  priceTiers?: PriceTier[] | null;
};

type Item = { productId: string; quantity: number; salePrice: number; costPrice: number };

// Trouve le prix correspondant à la quantité dans la grille tarifaire.
// Retourne null si pas de grille ou pas de palier qui matche.
function priceForQuantity(product: Product | undefined, quantity: number): number | null {
  if (!product || !product.priceTiers || product.priceTiers.length === 0) return null;
  const sorted = [...product.priceTiers].sort((a, b) => b.minQty - a.minQty);
  const tier = sorted.find((t) => quantity >= t.minQty);
  return tier ? tier.price : null;
}

export function OrderForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    customerSnapchat: "",
    status: "PENDING",
    trackingNumber: "",
    carrier: "",
    shippingCost: 0,
    notes: "",
  });
  const [items, setItems] = useState<Item[]>([
    { productId: products[0]?.id ?? "", quantity: 1, salePrice: products[0]?.salePrice ?? 0, costPrice: products[0]?.costPrice ?? 0 },
  ]);

  const totalRevenue = items.reduce((s, i) => s + i.salePrice * i.quantity, 0);
  const totalCost = items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
  const totalProfit = totalRevenue - totalCost - (Number(form.shippingCost) || 0);

  function setItem(idx: number, patch: Partial<Item>) {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const merged = { ...it, ...patch };
        // Auto-applique le prix selon la grille tarifaire si la quantité change
        if (patch.quantity !== undefined || patch.productId !== undefined) {
          const p = products.find((x) => x.id === merged.productId);
          const tierPrice = priceForQuantity(p, merged.quantity);
          if (tierPrice !== null && patch.salePrice === undefined) {
            merged.salePrice = tierPrice;
          }
        }
        return merged;
      })
    );
  }
  function addItem() {
    const p = products[0];
    setItems([...items, { productId: p?.id ?? "", quantity: 1, salePrice: p?.salePrice ?? 0, costPrice: p?.costPrice ?? 0 }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || items.some((i) => !i.productId)) {
      toast.error("Ajoutez au moins un produit");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error?.toString?.() || "Erreur lors de la création");
      return;
    }
    toast.success("Commande créée");
    router.push("/orders");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-5xl">
      <PageHeader
        title="Nouvelle commande"
        description="Renseignez les informations client et les produits"
        action={
          <Link href="/orders" className="btn-ghost">
            <ArrowLeft className="h-4 w-4" /> Retour
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold">Client</h3>
          <div className="space-y-2">
            <label className="label">Nom *</label>
            <input
              required
              className="input"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.customerEmail}
                onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Téléphone</label>
              <input
                className="input"
                value={form.customerPhone}
                onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="label">Adresse</label>
            <textarea
              rows={3}
              className="input min-h-[80px]"
              value={form.customerAddress}
              onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label className="label">Snapchat</label>
            <input
              className="input"
              placeholder="@pseudo"
              value={form.customerSnapchat}
              onChange={(e) => setForm({ ...form, customerSnapchat: e.target.value })}
            />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h3 className="font-semibold">Expédition</h3>
          <div className="space-y-2">
            <label className="label">Statut</label>
            <select
              className="input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label">Transporteur</label>
              <select
                className="input"
                value={form.carrier}
                onChange={(e) => setForm({ ...form, carrier: e.target.value })}
              >
                <option value="">—</option>
                {CARRIERS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="label">N° de suivi</label>
              <input
                className="input"
                value={form.trackingNumber}
                onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })}
              />
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
              <p className="text-xs text-muted-foreground">Sera déduit du bénéfice de la commande</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="label">Notes internes</label>
            <textarea
              rows={3}
              className="input min-h-[80px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Articles</h3>
          <button type="button" onClick={addItem} className="btn-secondary">
            <Plus className="h-4 w-4" /> Ajouter
          </button>
        </div>
        <div className="space-y-3">
          {items.map((it, idx) => {
            const p = products.find((x) => x.id === it.productId);
            return (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-5 space-y-1">
                  <label className="label text-xs">Produit</label>
                  <select
                    className="input"
                    value={it.productId}
                    onChange={(e) => {
                      const np = products.find((p) => p.id === e.target.value);
                      setItem(idx, {
                        productId: e.target.value,
                        salePrice: np?.salePrice ?? it.salePrice,
                        costPrice: np?.costPrice ?? it.costPrice,
                      });
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — stock {p.unlimitedStock ? "∞" : p.quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <label className="label text-xs">Qté</label>
                  <input
                    type="number"
                    min={1}
                    max={p?.unlimitedStock ? undefined : p?.quantity ?? undefined}
                    className="input"
                    value={it.quantity}
                    onChange={(e) => setItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <label className="label text-xs">PV unitaire</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="input"
                    value={it.salePrice}
                    onChange={(e) => setItem(idx, { salePrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2 space-y-1">
                  <label className="label text-xs">Coût unitaire</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    className="input"
                    value={it.costPrice}
                    onChange={(e) => setItem(idx, { costPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="col-span-12 sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="btn-icon text-rose-500 hover:bg-rose-500/10 w-full sm:w-9"
                    aria-label="Retirer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-border mt-5 pt-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Chiffre d'affaires</div>
            <div className="text-lg font-semibold">{formatCurrency(totalRevenue)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Coût produits</div>
            <div className="text-lg font-semibold">{formatCurrency(totalCost)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Coût expédition</div>
            <div className="text-lg font-semibold">{formatCurrency(Number(form.shippingCost) || 0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Bénéfice net</div>
            <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalProfit)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/orders" className="btn-secondary">Annuler</Link>
        <button disabled={loading} className="btn-primary">
          {loading ? "Création..." : "Créer la commande"}
        </button>
      </div>
    </form>
  );
}
