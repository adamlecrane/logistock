import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PERIOD_DAYS, PLAN_CURRENCY, PLAN_PRICE } from "@/lib/plan";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date();
  // Extend from current expiry if still valid, otherwise from now
  const base = user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
  const expiresAt = new Date(base);
  expiresAt.setDate(expiresAt.getDate() + PERIOD_DAYS);

  const reference = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        planStatus: "ACTIVE",
        planExpiresAt: expiresAt,
        lastPaymentAt: now,
      },
    }),
    prisma.payment.create({
      data: {
        userId,
        amount: PLAN_PRICE,
        currency: PLAN_CURRENCY,
        method: "CARD",
        status: "PAID",
        reference,
      },
    }),
    prisma.activityLog.create({
      data: {
        userId,
        action: "BILLING_SUBSCRIBE",
        entity: "Subscription",
        meta: `${PLAN_PRICE} ${PLAN_CURRENCY} — ${reference}`,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, expiresAt, reference });
}
