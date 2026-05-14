import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const subSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  plan: z.string().min(1),
  amount: z.number().min(0),
  currency: z.string().default("EUR"),
  frequency: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY"),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).default("ACTIVE"),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

function nextBillingDate(startISO: string, frequency: string) {
  const d = new Date(startISO);
  if (frequency === "YEARLY") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.subscription.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const parse = subSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const data = parse.data;
  const startDate = data.startDate ? new Date(data.startDate) : new Date();

  const sub = await prisma.subscription.create({
    data: {
      customerName: data.customerName,
      customerEmail: data.customerEmail || null,
      customerPhone: data.customerPhone || null,
      plan: data.plan,
      amount: data.amount,
      currency: data.currency,
      frequency: data.frequency,
      status: data.status,
      startDate,
      nextBillingDate: nextBillingDate(startDate.toISOString(), data.frequency),
      notes: data.notes,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: "SUBSCRIPTION_CREATE",
      entity: "Subscription",
      entityId: sub.id,
      meta: `${sub.customerName} — ${sub.plan}`,
    },
  });

  return NextResponse.json(sub);
}
