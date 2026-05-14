import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerPhone: z.string().optional(),
  plan: z.string().min(1).optional(),
  amount: z.number().min(0).optional(),
  currency: z.string().optional(),
  frequency: z.enum(["MONTHLY", "YEARLY"]).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });

  const sub = await prisma.subscription.update({
    where: { id: params.id },
    data: { ...parse.data, customerEmail: parse.data.customerEmail === "" ? null : parse.data.customerEmail },
  });
  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: "SUBSCRIPTION_UPDATE",
      entity: "Subscription",
      entityId: sub.id,
      meta: sub.customerName,
    },
  });
  return NextResponse.json(sub);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.subscription.delete({ where: { id: params.id } });
  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: "SUBSCRIPTION_DELETE",
      entity: "Subscription",
      entityId: params.id,
    },
  });
  return NextResponse.json({ ok: true });
}
