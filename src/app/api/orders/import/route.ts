import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderReference, buildTrackingUrl } from "@/lib/utils";

// Expected CSV header (case-insensitive):
// customerName,customerEmail,customerPhone,customerAddress,sku,quantity,salePrice,costPrice,carrier,trackingNumber,status,notes
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const text = await req.text();
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return NextResponse.json({ error: "CSV vide" }, { status: 400 });

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => header.indexOf(k.toLowerCase());

  const created: string[] = [];
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvRow(lines[li]);
    const sku = cols[idx("sku")];
    const qty = parseInt(cols[idx("quantity")] || "1");
    const product = await prisma.product.findUnique({ where: { sku } });
    if (!product) continue;
    const salePrice = parseFloat(cols[idx("saleprice")] || String(product.salePrice));
    const costPrice = parseFloat(cols[idx("costprice")] || String(product.costPrice));
    if (product.quantity < qty) continue;

    const carrier = cols[idx("carrier")] || undefined;
    const trackingNumber = cols[idx("trackingnumber")] || undefined;

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          reference: generateOrderReference(),
          customerName: cols[idx("customername")] || "Client",
          customerEmail: cols[idx("customeremail")] || null,
          customerPhone: cols[idx("customerphone")] || null,
          customerAddress: cols[idx("customeraddress")] || null,
          status: (cols[idx("status")] as any) || "PENDING",
          carrier,
          trackingNumber,
          trackingUrl: buildTrackingUrl(carrier, trackingNumber),
          notes: cols[idx("notes")] || null,
          totalRevenue: salePrice * qty,
          totalCost: costPrice * qty,
          totalProfit: (salePrice - costPrice) * qty,
          createdById: (session.user as any).id,
          items: {
            create: [{
              productId: product.id,
              productName: product.name,
              quantity: qty,
              salePrice,
              costPrice,
            }],
          },
        },
      });
      await tx.product.update({ where: { id: product.id }, data: { quantity: { decrement: qty } } });
      await tx.stockMovement.create({
        data: { productId: product.id, type: "OUT", quantity: qty, reason: `Import ${order.reference}`, userId: (session.user as any).id },
      });
      created.push(order.reference);
    });
  }

  return NextResponse.json({ created: created.length, references: created });
}

function parseCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else {
      if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; }
      else cur += c;
    }
  }
  out.push(cur);
  return out;
}
