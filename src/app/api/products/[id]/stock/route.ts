import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().int(),
  reason: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { type, quantity, reason } = parse.data;
  let nextQty = product.quantity;
  if (type === "IN") nextQty += Math.abs(quantity);
  else if (type === "OUT") nextQty -= Math.abs(quantity);
  else nextQty = Math.max(0, quantity);
  if (nextQty < 0) return NextResponse.json({ error: "Stock négatif impossible" }, { status: 400 });

  await prisma.$transaction([
    prisma.product.update({ where: { id: product.id }, data: { quantity: nextQty } }),
    prisma.stockMovement.create({
      data: {
        productId: product.id,
        type,
        quantity:
          type === "ADJUST" ? nextQty - product.quantity : Math.abs(quantity),
        reason: reason || `Mouvement ${type}`,
        userId: (session.user as any).id,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, quantity: nextQty });
}
