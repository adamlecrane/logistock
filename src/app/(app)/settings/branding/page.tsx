import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BrandingForm } from "./_form";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      brandName: true,
      brandLogoUrl: true,
      brandEmail: true,
      brandPhone: true,
      brandAddress: true,
      brandLegalInfo: true,
      brandPrimaryColor: true,
    },
  });

  return <BrandingForm initial={user ?? {}} />;
}
