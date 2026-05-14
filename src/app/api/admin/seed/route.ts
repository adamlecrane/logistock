import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Route protégée par un token secret : POST /api/admin/seed?token=XYZ
// Crée les comptes admin/client de démo + produits + commandes de test.
// Idempotent : si le compte admin existe déjà, on ne refait rien.

const SEED_TOKEN = process.env.SEED_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!SEED_TOKEN) {
    return NextResponse.json(
      { error: "SEED_TOKEN n'est pas configuré côté serveur." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const provided = searchParams.get("token");
  if (provided !== SEED_TOKEN) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  const adminEmail = "admin@logistock.local";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    return NextResponse.json({
      ok: true,
      alreadySeeded: true,
      message: "Données déjà initialisées.",
    });
  }

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin",
      passwordHash: await bcrypt.hash("admin123", 10),
      role: "OWNER",
      planStatus: "ACTIVE",
    },
  });

  await prisma.user.create({
    data: {
      email: "client@logistock.local",
      name: "Client Démo",
      passwordHash: await bcrypt.hash("client123", 10),
      role: "ADMIN",
      planStatus: "TRIAL",
      trialEndsAt: trialEnd,
    },
  });

  const PRODUCTS = [
    { name: "Casque Bluetooth Pro", sku: "AUDIO-001", supplier: "AudioTech", quantity: 42, lowStockAt: 10, costPrice: 28.5, salePrice: 79.9 },
    { name: "Montre connectée Sport", sku: "WATCH-002", supplier: "FitGear", quantity: 18, lowStockAt: 8, costPrice: 45, salePrice: 119 },
    { name: "Coque iPhone Premium", sku: "CASE-003", supplier: "Shield Co.", quantity: 120, lowStockAt: 30, costPrice: 4.2, salePrice: 19.9 },
    { name: "Chargeur sans fil 15W", sku: "CHRG-004", supplier: "PowerHub", quantity: 7, lowStockAt: 10, costPrice: 9.5, salePrice: 29.9 },
    { name: "Sac à dos urbain", sku: "BAG-005", supplier: "UrbanLine", quantity: 25, lowStockAt: 5, costPrice: 22, salePrice: 59.9 },
  ];

  const products = await Promise.all(
    PRODUCTS.map((p) => prisma.product.create({ data: p }))
  );

  for (const p of products) {
    await prisma.stockMovement.create({
      data: {
        productId: p.id,
        type: "IN",
        quantity: p.quantity,
        reason: "Stock initial",
        userId: admin.id,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: admin.id,
      action: "SEED",
      entity: "System",
      meta: "Initial seed via /api/admin/seed",
    },
  });

  return NextResponse.json({
    ok: true,
    created: {
      admin: adminEmail,
      client: "client@logistock.local",
      products: products.length,
    },
    message: "Seed terminé. Connecte-toi avec admin@logistock.local / admin123",
  });
}
