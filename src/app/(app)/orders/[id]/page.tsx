import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { OrderDetail } from "./_detail";

export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, invoice: true },
  });
  if (!order) notFound();
  return <OrderDetail order={order as any} invoice={order.invoice} />;
}
