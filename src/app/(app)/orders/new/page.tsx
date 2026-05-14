import { prisma } from "@/lib/prisma";
import { OrderForm } from "../_form";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  // Cast priceTiers JsonValue -> PriceTier[] pour le client
  const productsForForm = products.map((p) => ({
    ...p,
    priceTiers: (p.priceTiers as any) ?? [],
  }));
  return <OrderForm products={productsForForm as any} />;
}
