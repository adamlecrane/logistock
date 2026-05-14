import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const priceTierSchema = z.object({
  minQty: z.number().int().min(1),
  price: z.number().min(0),
});

const imageUrlSchema = z
  .string()
  .max(3_000_000)
  .refine(
    (v) => v === "" || /^https?:\/\//.test(v) || /^data:image\//.test(v),
    "URL d'image invalide"
  )
  .optional();

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  sku: z.string().min(1).optional(),
  description: z.string().optional(),
  imageUrl: imageUrlSchema,
  supplier: z.string().optional(),
  quantity: z.number().int().min(0).optional(),
  unlimitedStock: z.boolean().optional(),
  lowStockAt: z.number().int().min(0).optional(),
  costPrice: z.number().min(0).optional(),
  salePrice: z.number().min(0).optional(),
  priceTiers: z.array(priceTierSchema).max(20).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const existing = await prisma.product.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = parse.data;

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: any = { ...data };
    if (data.imageUrl !== undefined) {
      updateData.imageUrl = data.imageUrl === "" ? null : data.imageUrl;
    }
    if (data.priceTiers !== undefined) {
      updateData.priceTiers = data.priceTiers as any;
    }

    const p = await tx.product.update({
      where: { id: params.id },
      data: updateData,
    });

    if (
      data.quantity !== undefined &&
      data.quantity !== existing.quantity &&
      !p.unlimitedStock
    ) {
      const diff = data.quantity - existing.quantity;
      await tx.stockMovement.create({
        data: {
          productId: p.id,
          type: "ADJUST",
          quantity: diff,
          reason: "Ajustement manuel",
          userId: (session.user as any).id,
        },
      });
    }
    await tx.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "PRODUCT_UPDATE",
        entity: "Product",
        entityId: p.id,
        meta: p.name,
      },
    });
    return p;
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const used = await prisma.orderItem.count({ where: { productId: params.id } });
  if (used > 0) {
    return NextResponse.json(
      { error: "Produit utilisé dans des commandes — impossible de supprimer." },
      { status: 400 }
    );
  }
  await prisma.stockMovement.deleteMany({ where: { productId: params.id } });
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
