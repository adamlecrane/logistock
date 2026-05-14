import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildTrackingUrl, generateOrderReference } from "@/lib/utils";
import { DEFAULT_VAT_RATE, PAYMENT_DUE_DAYS, computeInvoiceTotals, generateInvoiceNumber } from "@/lib/invoice";

const itemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1),
  salePrice: z.number().min(0),
  costPrice: z.number().min(0),
});

const orderSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  customerAddress: z.string().optional(),
  customerSnapchat: z.string().optional(),
  status: z.enum(["PENDING", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"]).default("PENDING"),
  trackingNumber: z.string().optional(),
  carrier: z.string().optional(),
  shippingCost: z.number().min(0).default(0),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const status = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "20"));

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (q) {
    where.OR = [
      { reference: { contains: q } },
      { customerName: { contains: q } },
      { customerEmail: { contains: q } },
      { trackingNumber: { contains: q } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parse = orderSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const data = parse.data;

  // Validate stock and load product names
  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const it of data.items) {
    const p = byId.get(it.productId);
    if (!p) return NextResponse.json({ error: `Produit introuvable: ${it.productId}` }, { status: 400 });
    if (p.quantity < it.quantity) {
      return NextResponse.json({ error: `Stock insuffisant pour ${p.name}` }, { status: 400 });
    }
  }

  let totalRevenue = 0;
  let totalCost = 0;
  for (const it of data.items) {
    totalRevenue += it.salePrice * it.quantity;
    totalCost += it.costPrice * it.quantity;
  }
  const trackingUrl = buildTrackingUrl(data.carrier, data.trackingNumber);

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        reference: generateOrderReference(),
        customerName: data.customerName,
        customerEmail: data.customerEmail || null,
        customerPhone: data.customerPhone,
        customerAddress: data.customerAddress,
        customerSnapchat: data.customerSnapchat || null,
        status: data.status,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        trackingUrl,
        notes: data.notes,
        totalRevenue,
        totalCost,
        shippingCost: data.shippingCost || 0,
        totalProfit: totalRevenue - totalCost - (data.shippingCost || 0),
        createdById: (session.user as any).id,
        items: {
          create: data.items.map((it) => ({
            productId: it.productId,
            productName: byId.get(it.productId)!.name,
            quantity: it.quantity,
            salePrice: it.salePrice,
            costPrice: it.costPrice,
          })),
        },
      },
      include: { items: true },
    });

    // Decrement stock + movement
    for (const it of data.items) {
      await tx.product.update({
        where: { id: it.productId },
        data: { quantity: { decrement: it.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: it.productId,
          type: "OUT",
          quantity: it.quantity,
          reason: `Commande ${order.reference}`,
          userId: (session.user as any).id,
        },
      });
    }

    // Auto-create invoice
    const invoiceNumber = await generateInvoiceNumber();
    const totals = computeInvoiceTotals(totalRevenue, DEFAULT_VAT_RATE);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + PAYMENT_DUE_DAYS);

    await tx.invoice.create({
      data: {
        number: invoiceNumber,
        orderId: order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        amountHT: totals.amountHT,
        vatRate: DEFAULT_VAT_RATE,
        vatAmount: totals.vatAmount,
        amountTTC: totals.amountTTC,
        currency: "EUR",
        status: order.status === "DELIVERED" ? "PAID" : "ISSUED",
        paidAt: order.status === "DELIVERED" ? new Date() : null,
        dueDate,
      },
    });

    await tx.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "ORDER_CREATE",
        entity: "Order",
        entityId: order.id,
        meta: `${order.reference} · ${invoiceNumber}`,
      },
    });
    return order;
  });

  return NextResponse.json(created);
}
