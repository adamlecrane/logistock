import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  supplier: z.string().optional(),
  quantity: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(0).default(5),
  costPrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q")?.trim();
  const where: any = q
    ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { supplier: { contains: q } }] }
    : {};
  const items = await prisma.product.findMany({ where, orderBy: { name: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parse = productSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const data = parse.data;

  const created = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: { ...data, imageUrl: data.imageUrl || null },
    });
    if (data.quantity > 0) {
      await tx.stockMovement.create({
        data: {
          productId: p.id,
          type: "IN",
          quantity: data.quantity,
          reason: "Stock initial",
          userId: (session.user as any).id,
        },
      });
    }
    await tx.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "PRODUCT_CREATE",
        entity: "Product",
        entityId: p.id,
        meta: p.name,
      },
    });
    return p;
  });

  return NextResponse.json(created);
}
