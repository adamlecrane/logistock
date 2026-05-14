import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTrackingUrl } from "@/lib/utils";

const updateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerSnapchat: z.string().optional(),
  status: z.enum(["PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, createdBy: true },
  });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const data = parse.data;
  const existing = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const trackingNumber = data.trackingNumber ?? existing.trackingNumber;
  const carrier = data.carrier ?? existing.carrier;

  // If transitioning to CANCELLED from non-cancelled — restock items
  let stockOps: { productId: string; quantity: number }[] = [];
  if (data.status === "CANCELLED" && existing.status !== "CANCELLED") {
    stockOps = existing.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
  }

  const newShipping = data.shippingCost ?? existing.shippingCost;
  const newProfit = existing.totalRevenue - existing.totalCost - newShipping;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.order.update({
      where: { id: params.id },
      data: {
        ...data,
        customerEmail: data.customerEmail === "" ? null : data.customerEmail ?? existing.customerEmail,
        trackingUrl: buildTrackingUrl(carrier, trackingNumber),
        totalProfit: newProfit,
      },
      include: { items: true },
    });

    for (const op of stockOps) {
      await tx.product.update({
        where: { id: op.productId },
        data: { quantity: { increment: op.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: op.productId,
          type: "IN",
          quantity: op.quantity,
          reason: `Annulation commande ${existing.reference}`,
          userId: (session.user as any).id,
        },
      });
    }

    // Auto-update linked invoice status
    if (data.status && data.status !== existing.status) {
      if (data.status === "DELIVERED") {
        await tx.invoice.updateMany({
          where: { orderId: existing.id, status: { not: "PAID" } },
          data: { status: "PAID", paidAt: new Date() },
        });
      } else if (data.status === "CANCELLED") {
        await tx.invoice.updateMany({
          where: { orderId: existing.id },
          data: { status: "CANCELLED" },
        });
      }
    }

    await tx.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "ORDER_UPDATE",
        entity: "Order",
        entityId: u.id,
        meta: u.reference,
      },
    });

    return u;
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    // Restock if not cancelled
    if (existing.status !== "CANCELLED") {
      for (const it of existing.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { quantity: { increment: it.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: it.productId,
            type: "IN",
            quantity: it.quantity,
            reason: `Suppression commande ${existing.reference}`,
            userId: (session.user as any).id,
          },
        });
      }
    }
    await tx.order.delete({ where: { id: params.id } });
    await tx.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "ORDER_DELETE",
        entity: "Order",
        entityId: params.id,
        meta: existing.reference,
      },
    });
  });

  return NextResponse.json({ ok: true });
}
