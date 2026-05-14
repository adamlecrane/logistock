"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AlertTriangle, Edit3, Plus, Search, Trash2, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  supplier: string | null;
  quantity: number;
  lowStockAt: number;
  costPrice: number;
  salePrice: number;
};

const empty: Partial<Product> = {
  name: "",
  sku: "",
  description: "",
  imageUrl: "",
  supplier: "",
  quantity: 0,
  lowStockAt: 5,
  costPrice: 0,
  salePrice: 0,
};

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Product> | null>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return products;
    const s = q.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s) ||
        (p.supplier || "").toLowerCase().includes(s)
    );
  }, [products, q]);

  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    const payload = {
      name: editing.name,
      sku: editing.sku,
      description: editing.description,
      imageUrl: editing.imageUrl,
      supplier: editing.supplier,
      quantity: Number(editing.quantity) || 0,
      lowStockAt: Number(editing.lowStockAt) || 0,
      costPrice: Number(editing.costPrice) || 0,
      salePrice: Number(editing.salePrice) || 0,
    };
    const res = await fetch(isNew ? "/api/products" : `/api/products/${editing.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error?.toString?.() || "Erreur");
      return;
    }
    toast.success(isNew ? "Produit créé" : "Produit mis à jour");
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return toast.error(j?.error || "Erreur");
    }
    toast.success("Produit supprimé");
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
            placeholder="Rechercher par nom, SKU, fournisseur..."
            className="input pl-9"
          />
        </div>
        <button onClick={() => setEditing({ ...empty })} className="btn-primary">
          <Plus className="h-4 w-4" /> Nouveau produit
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Produit</th>
                <th className="py-3 px-5 font-medium">SKU</th>
                <th className="py-3 px-5 font-medium">Stock</th>
                <th className="py-3 px-5 font-medium">Prix d'achat</th>
                <th className="py-3 px-5 font-medium">Prix de vente</th>
                <th className="py-3 px-5 font-medium">Marge</th>
                <th className="py-3 px-5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    Aucun produit.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const margin = p.salePrice > 0 ? ((p.salePrice - p.costPrice) / p.salePrice) * 100 : 0;
                const low = p.quantity <= p.lowStockAt;
                return (
                  <tr key={p.id} className="border-t border-border/60 table-row-hover">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt="" className="h-9 w-9 rounded-md object-cover ring-1 ring-border" />
                        ) : (
                          <div className="h-9 w-9 rounded-md bg-muted ring-1 ring-border" />
                        )}
                        <div>
                          <div className="font-medium">{p.name}</div>
                          {p.supplier && (
                            <div className="text-xs text-muted-foreground">{p.supplier}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs">{p.sku}</td>
                    <td className="py-3 px-5">
                      <span className={cn("badge ring-1", low
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30"
                        : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30")}>
                        {low && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {p.quantity}
                      </span>
                    </td>
                    <td className="py-3 px-5">{formatCurrency(p.costPrice)}</td>
                    <td className="py-3 px-5">{formatCurrency(p.salePrice)}</td>
                    <td className="py-3 px-5 text-emerald-600 dark:text-emerald-400">{margin.toFixed(1)}%</td>
                    <td className="py-3 px-5 text-right">
                      <button onClick={() => setEditing(p)} className="btn-icon" aria-label="Modifier">
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(p.id)} className="btn-icon text-rose-500 hover:bg-rose-500/10" aria-label="Supprimer">
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
        <ProductDialog
          value={editing}
          onChange={setEditing}
          onSave={save}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function ProductDialog({
  value,
  onChange,
  onSave,
  onClose,
}: {
  value: Partial<Product>;
  onChange: (v: Partial<Product>) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  const isNew = !value.id;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-fade-in">
      <div className="w-full max-w-2xl card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{isNew ? "Nouveau produit" : "Modifier le produit"}</h3>
          <button onClick={onClose} className="btn-icon"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-2">
            <label className="label">Nom *</label>
            <input className="input" value={value.name || ""} onChange={(e) => onChange({ ...value, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="label">SKU *</label>
            <input className="input" value={value.sku || ""} onChange={(e) => onChange({ ...value, sku: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="label">Fournisseur</label>
            <input className="input" value={value.supplier || ""} onChange={(e) => onChange({ ...value, supplier: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="label">Quantité</label>
            <input type="number" min={0} className="input" value={value.quantity ?? 0} onChange={(e) => onChange({ ...value, quantity: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <label className="label">Seuil alerte</label>
            <input type="number" min={0} className="input" value={value.lowStockAt ?? 5} onChange={(e) => onChange({ ...value, lowStockAt: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <label className="label">Prix d'achat (€)</label>
            <input type="number" step="0.01" min={0} className="input" value={value.costPrice ?? 0} onChange={(e) => onChange({ ...value, costPrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <label className="label">Prix de vente (€)</label>
            <input type="number" step="0.01" min={0} className="input" value={value.salePrice ?? 0} onChange={(e) => onChange({ ...value, salePrice: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="label">URL image</label>
            <input className="input" placeholder="https://..." value={value.imageUrl || ""} onChange={(e) => onChange({ ...value, imageUrl: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-2">
            <label className="label">Description</label>
            <textarea rows={3} className="input min-h-[80px]" value={value.description || ""} onChange={(e) => onChange({ ...value, description: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary">Annuler</button>
          <button onClick={onSave} className="btn-primary">{isNew ? "Créer" : "Enregistrer"}</button>
        </div>
      </div>
    </div>
  );
}
