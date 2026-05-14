"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Upload, Trash2, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/page-header";

type Branding = {
  brandName?: string | null;
  brandLogoUrl?: string | null;
  brandEmail?: string | null;
  brandPhone?: string | null;
  brandAddress?: string | null;
  brandLegalInfo?: string | null;
  brandPrimaryColor?: string | null;
};

const MAX_BYTES = 1_500_000; // ~1.5 MB pour rester < limite request body

export function BrandingForm({ initial }: { initial: Branding }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Branding>({
    brandName: initial.brandName || "",
    brandLogoUrl: initial.brandLogoUrl || "",
    brandEmail: initial.brandEmail || "",
    brandPhone: initial.brandPhone || "",
    brandAddress: initial.brandAddress || "",
    brandLegalInfo: initial.brandLegalInfo || "",
    brandPrimaryColor: initial.brandPrimaryColor || "#E10600",
  });

  function onPick() {
    fileInput.current?.click();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Sélectionnez une image");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image trop lourde (max 1.5 Mo)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setForm((f) => ({ ...f, brandLogoUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setForm((f) => ({ ...f, brandLogoUrl: "" }));
    if (fileInput.current) fileInput.current.value = "";
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/settings/branding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error?.toString?.() || "Erreur lors de la sauvegarde");
      return;
    }
    toast.success("Personnalisation enregistrée");
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Personnalisation des factures"
        description="Logo, coordonnées et couleur — apparaîtront sur toutes vos factures."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Logo + couleur */}
        <div className="card p-5 space-y-4">
          <h3 className="font-semibold">Identité visuelle</h3>

          <div className="space-y-2">
            <label className="label">Logo de l'entreprise</label>
            <div className="aspect-square w-full rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
              {form.brandLogoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={form.brandLogoUrl}
                  alt="Logo"
                  className="max-h-full max-w-full object-contain p-4"
                />
              ) : (
                <div className="text-center text-muted-foreground text-xs space-y-2">
                  <ImageIcon className="h-10 w-10 mx-auto opacity-40" />
                  <div>Aucun logo</div>
                </div>
              )}
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={onFile}
              className="hidden"
            />
            <div className="flex gap-2">
              <button type="button" onClick={onPick} className="btn-secondary flex-1">
                <Upload className="h-4 w-4" /> Téléverser
              </button>
              {form.brandLogoUrl ? (
                <button
                  type="button"
                  onClick={clearLogo}
                  className="btn-icon text-rose-500 hover:bg-rose-500/10"
                  aria-label="Retirer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, SVG, WebP — max 1.5 Mo</p>
          </div>

          <div className="space-y-2">
            <label className="label">Couleur principale</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.brandPrimaryColor || "#E10600"}
                onChange={(e) => setForm({ ...form, brandPrimaryColor: e.target.value })}
                className="h-10 w-14 rounded-md border border-border cursor-pointer bg-transparent"
              />
              <input
                className="input flex-1 font-mono"
                value={form.brandPrimaryColor || ""}
                onChange={(e) => setForm({ ...form, brandPrimaryColor: e.target.value })}
                placeholder="#E10600"
              />
            </div>
          </div>
        </div>

        {/* Coordonnées */}
        <div className="card p-5 space-y-4 lg:col-span-2">
          <h3 className="font-semibold">Coordonnées de l'entreprise</h3>

          <div className="space-y-2">
            <label className="label">Nom commercial</label>
            <input
              className="input"
              placeholder="Mon Entreprise SAS"
              value={form.brandName || ""}
              onChange={(e) => setForm({ ...form, brandName: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="contact@entreprise.com"
                value={form.brandEmail || ""}
                onChange={(e) => setForm({ ...form, brandEmail: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="label">Téléphone</label>
              <input
                className="input"
                placeholder="+33 1 23 45 67 89"
                value={form.brandPhone || ""}
                onChange={(e) => setForm({ ...form, brandPhone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="label">Adresse</label>
            <textarea
              rows={3}
              className="input min-h-[80px]"
              placeholder="123 rue de la République&#10;75001 Paris&#10;France"
              value={form.brandAddress || ""}
              onChange={(e) => setForm({ ...form, brandAddress: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="label">Mentions légales</label>
            <textarea
              rows={2}
              className="input min-h-[60px]"
              placeholder="SIRET : 123 456 789 00012 — TVA intra : FR12345678901"
              value={form.brandLegalInfo || ""}
              onChange={(e) => setForm({ ...form, brandLegalInfo: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Apparaîtra en bas de la facture
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={save} disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
