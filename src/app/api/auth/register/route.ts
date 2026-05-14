import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email().max(120),
  password: z.string().min(6).max(100),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Champs invalides. Mot de passe min. 6 caractères." },
      { status: 400 }
    );
  }

  const { name, email, password } = parse.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email." },
      { status: 409 }
    );
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 10);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      role: "ADMIN",
      planStatus: "TRIAL",
      trialEndsAt: trialEnd,
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ ok: true, user });
}
