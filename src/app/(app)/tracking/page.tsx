import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { TrackingGenerator } from "./_generator";

export const dynamic = "force-dynamic";

export default async function TrackingPage() {
  const recent = await prisma.order.findMany({
    where: { trackingNumber: { not: null } },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Suivi colis"
        description="Générez instantanément un lien et un message client à envoyer"
      />
      <TrackingGenerator recentOrders={recent} />
    </div>
  );
}
