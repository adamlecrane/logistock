import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { UsersTable } from "./_table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gérez les accès à votre application"
      />
      <UsersTable users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))} />
    </div>
  );
}
