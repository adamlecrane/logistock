import { prisma } from "@/lib/prisma";
import { OrderForm } from "../_form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return <OrderForm products={products} />;
}
