import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const priceTierSchema = z.object({
  minQty: z.number().int().min(1),
  price: z.number().min(0),
});

// imageUrl accepte:
//  - une URL http/https
//  - une data URL (image upload\u00e9e en base64)
//  - chaine vide
const imageUrlSchema = z
  .string()
  .max(3_000_000) // ~2.2 Mo en base64
  .refine(
    (v) => v === "" || /^https?:\/\//.test(v) || /^data:image\//.test(v),
    "URL d'image invalide"
  )
  .optional();

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  description: z.string().optional(),
  imageUrl: imageUrlSchema,
  supplier: z.string().optional(),
  quantity: z.number().int().min(0).default(0),
  unlimitedStock: z.boolean().default(false),
  lowStockAt: z.number().int().min(0).default(5),
  costPrice: z.number().min(0).default(0),
  salePrice: z.number().min(0).default(0),
  priceTiers: z.array(priceTierSchema).max(20).optional(),
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
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const data = parse.data;

  // Si stock illimité, on stocke 0 mais c'est ignoré côté commande
  const initialQty = data.unlimitedStock ? 0 : data.quantity;

  // SKU auto-généré si non fourni
  let sku = data.sku?.trim();
  if (!sku) {
    sku = `SKU-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
  }

  const created = await prisma.$transaction(async (tx) => {
    const p = await tx.product.create({
      data: {
        name: data.name,
        sku,
        description: data.description,
        imageUrl: data.imageUrl || null,
        supplier: data.supplier,
        quantity: initialQty,
        unlimitedStock: data.unlimitedStock,
        lowStockAt: data.lowStockAt,
        costPrice: data.costPrice,
        salePrice: data.salePrice,
        priceTiers: (data.priceTiers ?? []) as any,
      },
    });
    if (!data.unlimitedStock && initialQty > 0) {
      await tx.stockMovement.create({
        data: {
          productId: p.id,
          type: "IN",
          quantity: initialQty,
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
