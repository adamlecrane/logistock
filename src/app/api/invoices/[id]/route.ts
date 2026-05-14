import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["ISSUED", "PAID", "CANCELLED"]).optional(),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parse = updateSchema.safeParse(body);
  if (!parse.success) return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const data = parse.data;

  const updated = await prisma.invoice.update({
    where: { id: params.id },
    data: {
      ...data,
      paidAt: data.status === "PAID" ? new Date() : data.status === "ISSUED" ? null : undefined,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: (session.user as any).id,
      action: "INVOICE_UPDATE",
      entity: "Invoice",
      entityId: updated.id,
      meta: updated.number,
    },
  });

  return NextResponse.json(updated);
}
