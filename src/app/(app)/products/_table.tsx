"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Edit3,
  Infinity as InfinityIcon,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

type PriceTier = { minQty: number; price: number };

type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  imageUrl: string | null;
  supplier: string | null;
  quantity: number;
  unlimitedStock: boolean;
  lowStockAt: number;
  costPrice: number;
  salePrice: number;
  priceTiers: PriceTier[] | null;
};

const MAX_IMAGE_BYTES = 1_500_000; // ~1.5 Mo

const empty: Partial<Product> = {
  name: "",
  sku: "",
  description: "",
  imageUrl: "",
  supplier: "",
  quantity: 0,
  unlimitedStock: false,
  lowStockAt: 5,
  costPrice: 0,
  salePrice: 0,
  priceTiers: [],
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
    if (!editing.name?.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    const isNew = !editing.id;
    const tiers = (editing.priceTiers || []).filter(
      (t) => t && Number(t.minQty) >= 1 && Number(t.price) >= 0
    );
    const payload = {
      name: editing.name,
      sku: editing.sku,
      description: editing.description,
      imageUrl: editing.imageUrl,
      supplier: editing.supplier,
      quantity: Number(editing.quantity) || 0,
      unlimitedStock: Boolean(editing.unlimitedStock),
      lowStockAt: Number(editing.lowStockAt) || 0,
      costPrice: Number(editing.costPrice) || 0,
      salePrice: Number(editing.salePrice) || 0,
      priceTiers: tiers.map((t) => ({
        minQty: Number(t.minQty),
        price: Number(t.price),
      })),
    };
    const res = await fetch(isNew ? "/api/products" : `/api/products/${editing.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      const msg =
        typeof j?.error === "string"
          ? j.error
          : j?.error?.fieldErrors
          ? Object.entries(j.error.fieldErrors)
              .map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
              .join(" · ")
          : "Erreur";
      toast.error(msg);
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
                const low = !p.unlimitedStock && p.quantity <= p.lowStockAt;
                const tiers = Array.isArray(p.priceTiers) ? p.priceTiers : [];
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
                          {tiers.length > 0 && (
                            <div className="text-[10px] text-primary mt-0.5 font-medium">
                              {tiers.length} palier{tiers.length > 1 ? "s" : ""} tarifaire{tiers.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-5 font-mono text-xs">{p.sku}</td>
                    <td className="py-3 px-5">
                      {p.unlimitedStock ? (
                        <span className="badge ring-1 bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30">
                          <InfinityIcon className="h-3 w-3 mr-1" />
                          Illimité
                        </span>
                      ) : (
                        <span className={cn("badge ring-1", low
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30")}>
                          {low && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {p.quantity}
                        </span>
                      )}
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
  const fileInput = useRef<HTMLInputElement>(null);
  const tiers = Array.isArray(value.priceTiers) ? value.priceTiers : [];

  function pickImage() {
    fileInput.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Sélectionnez une image");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image trop lourde (max 1.5 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange({ ...value, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    onChange({ ...value, imageUrl: "" });
    if (fileInput.current) fileInput.current.value = "";
  }

  function addTier() {
    const newTiers = [...tiers];
    const lastQty = newTiers.length > 0 ? newTiers[newTiers.length - 1].minQty : 0;
    newTiers.push({ minQty: lastQty + 1, price: value.salePrice || 0 });
    onChange({ ...value, priceTiers: newTiers });
  }

  function updateTier(idx: number, patch: Partial<PriceTier>) {
    const newTiers = tiers.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange({ ...value, priceTiers: newTiers });
  }

  function removeTier(idx: number) {
    onChange({ ...value, priceTiers: tiers.filter((_, i) => i !== idx) });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-2xl card p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{isNew ? "Nouveau produit" : "Modifier le produit"}</h3>
          <button onClick={onClose} className="btn-icon"><X className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
          {/* Image */}
          <div className="space-y-2">
            <label className="label">Photo du produit</label>
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                {value.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={value.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFile}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={pickImage} className="btn-secondary flex-1">
                    <Upload className="h-4 w-4" /> Choisir une photo
                  </button>
                  {value.imageUrl ? (
                    <button
                      type="button"
                      onClick={clearImage}
                      className="btn-icon text-rose-500 hover:bg-rose-500/10"
                      aria-label="Retirer la photo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WebP — max 1.5 Mo. Sur mobile : galerie ou appareil photo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-2">
              <label className="label">Nom *</label>
              <input className="input" value={value.name || ""} onChange={(e) => onChange({ ...value, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="label">SKU</label>
              <input
                className="input"
                placeholder="Auto-généré si vide"
                value={value.sku || ""}
                onChange={(e) => onChange({ ...value, sku: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Fournisseur</label>
              <input className="input" value={value.supplier || ""} onChange={(e) => onChange({ ...value, supplier: e.target.value })} />
            </div>
          </div>

          {/* Stock */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(value.unlimitedStock)}
                onChange={(e) => onChange({ ...value, unlimitedStock: e.target.checked })}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium flex items-center gap-1.5">
                <InfinityIcon className="h-4 w-4 text-primary" />
                Stock illimité
              </span>
            </label>
            {!value.unlimitedStock && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="label">Quantité</label>
                  <input type="number" min={0} className="input" value={value.quantity ?? 0} onChange={(e) => onChange({ ...value, quantity: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <label className="label">Seuil alerte</label>
                  <input type="number" min={0} className="input" value={value.lowStockAt ?? 5} onChange={(e) => onChange({ ...value, lowStockAt: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            )}
          </div>

          {/* Prix */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label">Prix d'achat (€)</label>
              <input type="number" step="0.01" min={0} className="input" value={value.costPrice ?? 0} onChange={(e) => onChange({ ...value, costPrice: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-2">
              <label className="label">Prix de vente standard (€)</label>
              <input type="number" step="0.01" min={0} className="input" value={value.salePrice ?? 0} onChange={(e) => onChange({ ...value, salePrice: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>

          {/* Grille tarifaire */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Grille tarifaire (prix par quantité)</div>
                <div className="text-xs text-muted-foreground">Prix dégressifs selon la quantité commandée</div>
              </div>
              <button type="button" onClick={addTier} className="btn-secondary text-xs">
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </button>
            </div>
            {tiers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Aucun palier. Le prix standard ci-dessus sera utilisé.
              </p>
            ) : (
              <div className="space-y-2">
                {tiers.map((t, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground shrink-0 w-8">À partir de</span>
                    <input
                      type="number"
                      min={1}
                      className="input flex-1"
                      placeholder="Qté"
                      value={t.minQty}
                      onChange={(e) =>
                        updateTier(idx, { minQty: parseInt(e.target.value) || 1 })
                      }
                    />
                    <span className="text-xs text-muted-foreground shrink-0">unités →</span>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      className="input flex-1"
                      placeholder="Prix unitaire"
                      value={t.price}
                      onChange={(e) =>
                        updateTier(idx, { price: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <span className="text-xs shrink-0">€</span>
                    <button
                      type="button"
                      onClick={() => removeTier(idx)}
                      className="btn-icon text-rose-500 hover:bg-rose-500/10 shrink-0"
                      aria-label="Retirer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground">
                  Ex : 1 unité = 79,90 € · à partir de 10 unités = 65 € · à partir de 50 = 50 €
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input min-h-[80px]"
              value={value.description || ""}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
            />
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
