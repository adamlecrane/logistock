import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_LABELS: Record<string, { label: string; className: string }> = {
  ORDER_CREATE: { label: "Commande créée", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30" },
  ORDER_UPDATE: { label: "Commande modifiée", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30" },
  ORDER_DELETE: { label: "Commande supprimée", className: "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30" },
  PRODUCT_CREATE: { label: "Produit créé", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30" },
  PRODUCT_UPDATE: { label: "Produit modifié", className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/30" },
};

export default async function ActivityPage() {
  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: { select: { name: true, email: true } } },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Activité"
        description="Historique des dernières actions"
      />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Action</th>
                <th className="py-3 px-5 font-medium">Détail</th>
                <th className="py-3 px-5 font-medium">Utilisateur</th>
                <th className="py-3 px-5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-muted-foreground">
                    Aucune activité enregistrée.
                  </td>
                </tr>
              )}
              {logs.map((l) => {
                const meta = ACTION_LABELS[l.action] || { label: l.action, className: "bg-muted text-foreground ring-border" };
                return (
                  <tr key={l.id} className="border-t border-border/60 table-row-hover">
                    <td className="py-3 px-5">
                      <span className={`badge ring-1 ${meta.className}`}>{meta.label}</span>
                    </td>
                    <td className="py-3 px-5 text-muted-foreground">{l.meta || "—"}</td>
                    <td className="py-3 px-5">{l.user?.name || "—"}</td>
                    <td className="py-3 px-5 text-muted-foreground">{formatDateTime(l.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
