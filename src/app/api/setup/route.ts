import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Endpoint one-shot : ne fonctionne QUE si aucun compte OWNER n'existe.
// Permet de créer les comptes initiaux (propriétaire + amis gratuits à vie)
// sans aucun token. Devient inutilisable dès qu'un OWNER existe.

const accountSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  password: z.string().min(6).max(100),
  role: z.enum(["OWNER", "ADMIN"]).default("ADMIN"),
  lifetimeFree: z.boolean().default(false),
});

const bodySchema = z.object({
  accounts: z.array(accountSchema).min(1).max(20),
});

const LIFETIME_EXPIRY = new Date("2099-12-31T23:59:59Z");

export async function POST(req: NextRequest) {
  // Garde-fou : si un OWNER existe déjà, on refuse.
  const ownerExists = await prisma.user.findFirst({
    where: { role: "OWNER" },
    select: { id: true },
  });
  if (ownerExists) {
    return NextResponse.json(
      { error: "Le setup initial est déjà terminé. Endpoint désactivé." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parse = bodySchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parse.error.flatten() },
      { status: 400 }
    );
  }

  const created: { email: string; role: string; lifetimeFree: boolean }[] = [];
  for (const acc of parse.data.accounts) {
    const email = acc.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) continue;

    await prisma.user.create({
      data: {
        name: acc.name,
        email,
        passwordHash: await bcrypt.hash(acc.password, 10),
        role: acc.role,
        planStatus: acc.lifetimeFree || acc.role === "OWNER" ? "ACTIVE" : "TRIAL",
        planExpiresAt: acc.lifetimeFree || acc.role === "OWNER" ? LIFETIME_EXPIRY : null,
        trialEndsAt: acc.lifetimeFree || acc.role === "OWNER" ? null : (() => {
          const d = new Date();
          d.setDate(d.getDate() + 10);
          return d;
        })(),
      },
    });
    created.push({ email, role: acc.role, lifetimeFree: acc.lifetimeFree });
  }

  return NextResponse.json({ ok: true, created });
}
