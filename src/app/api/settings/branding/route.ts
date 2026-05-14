import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  brandName: z.string().max(120).optional().nullable(),
  brandLogoUrl: z.string().max(2_500_000).optional().nullable(), // permet une data URL base64 (~1.8MB)
  brandEmail: z.string().email().optional().or(z.literal("")).nullable(),
  brandPhone: z.string().max(40).optional().nullable(),
  brandAddress: z.string().max(500).optional().nullable(),
  brandLegalInfo: z.string().max(500).optional().nullable(),
  brandPrimaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/)
    .optional()
    .nullable(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    select: {
      brandName: true,
      brandLogoUrl: true,
      brandEmail: true,
      brandPhone: true,
      brandAddress: true,
      brandLegalInfo: true,
      brandPrimaryColor: true,
    },
  });
  return NextResponse.json(user ?? {});
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const data = parse.data;
  const updated = await prisma.user.update({
    where: { id: (session.user as any).id },
    data: {
      brandName: data.brandName ?? null,
      brandLogoUrl: data.brandLogoUrl ?? null,
      brandEmail: data.brandEmail === "" ? null : data.brandEmail ?? null,
      brandPhone: data.brandPhone ?? null,
      brandAddress: data.brandAddress ?? null,
      brandLegalInfo: data.brandLegalInfo ?? null,
      brandPrimaryColor: data.brandPrimaryColor ?? null,
    },
    select: {
      brandName: true,
      brandLogoUrl: true,
      brandEmail: true,
      brandPhone: true,
      brandAddress: true,
      brandLegalInfo: true,
      brandPrimaryColor: true,
    },
  });

  return NextResponse.json(updated);
}
