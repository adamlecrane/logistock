import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ProductsTable } from "./_table";
import { AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const productsRaw = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  const products = productsRaw.map((p) => ({
    ...p,
    priceTiers: (p.priceTiers as any) ?? [],
  }));
  const lowStock = products.filter((p) => !p.unlimitedStock && p.quantity <= p.lowStockAt);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock"
        description={`${products.length} produits — ${lowStock.length} en alerte stock faible`}
      />

      {lowStock.length > 0 && (
        <div className="card p-4 border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div className="text-sm">
            <strong>Stock faible</strong> — {lowStock.length} produit{lowStock.length > 1 ? "s" : ""} ont atteint leur seuil d'alerte :{" "}
            {lowStock.slice(0, 5).map((p) => p.name).join(", ")}
            {lowStock.length > 5 ? "…" : ""}
          </div>
        </div>
      )}

      <ProductsTable products={products} />
    </div>
  );
}
