import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Endpoint pour cr\u00e9er un compte (OWNER ou ADMIN gratuit \u00e0 vie).
// Authentification : email + mot de passe d'un compte OWNER existant.
// \u00c9vite d'avoir \u00e0 g\u00e9rer une session NextAuth via curl.

const schema = z.object({
  adminEmail: z.string().email(),
  adminPassword: z.string().min(1),
  newAccount: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().max(120),
    password: z.string().min(6).max(100),
    role: z.enum(["OWNER", "ADMIN"]).default("ADMIN"),
    lifetimeFree: z.boolean().default(false),
  }),
});

const LIFETIME_EXPIRY = new Date("2099-12-31T23:59:59Z");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parse = schema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { error: "Corps invalide.", details: parse.error.flatten() },
      { status: 400 }
    );
  }
  const { adminEmail, adminPassword, newAccount } = parse.data;

  // V\u00e9rifie les credentials de l'OWNER appelant
  const owner = await prisma.user.findUnique({
    where: { email: adminEmail.toLowerCase().trim() },
  });
  if (!owner || owner.role !== "OWNER") {
    return NextResponse.json(
      { error: "Identifiants OWNER invalides." },
      { status: 401 }
    );
  }
  const ok = await bcrypt.compare(adminPassword, owner.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Mot de passe OWNER incorrect." },
      { status: 401 }
    );
  }

  // V\u00e9rifie que l'email du nouveau compte n'existe pas d\u00e9j\u00e0
  const newEmail = newAccount.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: newEmail } });
  if (existing) {
    return NextResponse.json(
      { error: `Un compte existe d\u00e9j\u00e0 avec l'email ${newEmail}` },
      { status: 409 }
    );
  }

  const isLifetime = newAccount.lifetimeFree || newAccount.role === "OWNER";

  const created = await prisma.user.create({
    data: {
      name: newAccount.name,
      email: newEmail,
      passwordHash: await bcrypt.hash(newAccount.password, 10),
      role: newAccount.role,
      planStatus: isLifetime ? "ACTIVE" : "TRIAL",
      planExpiresAt: isLifetime ? LIFETIME_EXPIRY : null,
      trialEndsAt: isLifetime
        ? null
        : (() => {
            const d = new Date();
            d.setDate(d.getDate() + 10);
            return d;
          })(),
    },
    select: { id: true, email: true, name: true, role: true, planStatus: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: owner.id,
      action: "ACCOUNT_CREATE_BY_OWNER",
      entity: "User",
      entityId: created.id,
      meta: `${created.email} (${created.role}, lifetime=${isLifetime})`,
    },
  });

  return NextResponse.json({ ok: true, user: created });
}
