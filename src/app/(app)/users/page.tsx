import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { UsersTable } from "./_table";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "OWNER") notFound();

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
