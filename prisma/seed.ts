import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRODUCTS = [
  { name: "Casque Bluetooth Pro", sku: "AUDIO-001", supplier: "AudioTech", quantity: 42, lowStockAt: 10, costPrice: 28.5, salePrice: 79.9 },
  { name: "Montre connectée Sport", sku: "WATCH-002", supplier: "FitGear", quantity: 18, lowStockAt: 8, costPrice: 45, salePrice: 119 },
  { name: "Coque iPhone Premium", sku: "CASE-003", supplier: "Shield Co.", quantity: 120, lowStockAt: 30, costPrice: 4.2, salePrice: 19.9 },
  { name: "Chargeur sans fil 15W", sku: "CHRG-004", supplier: "PowerHub", quantity: 7, lowStockAt: 10, costPrice: 9.5, salePrice: 29.9 },
  { name: "Sac à dos urbain", sku: "BAG-005", supplier: "UrbanLine", quantity: 25, lowStockAt: 5, costPrice: 22, salePrice: 59.9 },
  { name: "Bouteille isotherme 750ml", sku: "BTL-006", supplier: "EcoLife", quantity: 60, lowStockAt: 15, costPrice: 6.8, salePrice: 24.9 },
  { name: "Lampe LED design", sku: "LAMP-007", supplier: "LightStudio", quantity: 14, lowStockAt: 5, costPrice: 18, salePrice: 49.9 },
  { name: "Câble USB-C 2m tressé", sku: "USBC-008", supplier: "CableCo", quantity: 200, lowStockAt: 50, costPrice: 2.5, salePrice: 12.9 },
];

const STATUSES = ["PENDING", "PREPARING", "SHIPPED", "DELIVERED"] as const;
const CARRIERS = ["COLISSIMO", "CHRONOPOST", "MONDIAL_RELAY", "DHL", "UPS"];
const NAMES = [
  "Marie Dupont", "Lucas Martin", "Camille Durand", "Antoine Leroy",
  "Sophie Bernard", "Hugo Petit", "Léa Moreau", "Paul Robert",
  "Emma Simon", "Nathan Laurent", "Chloé Michel", "Jules Garcia",
];
const EMAILS = (n: string) =>
  n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(" ", ".") + "@email.com";

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

async function main() {
  console.log("🌱 Seeding...");

  await prisma.payment.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@logistock.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Admin",
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "OWNER",         // Le propriétaire de l'app — pas de paywall
      planStatus: "ACTIVE",
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: "client@logistock.local",
      name: "Client Démo",
      passwordHash: await bcrypt.hash("client123", 10),
      role: "ADMIN",
      planStatus: "TRIAL",
      trialEndsAt: trialEnd,
    },
  });

  const products = await Promise.all(
    PRODUCTS.map((p) => prisma.product.create({ data: p }))
  );

  // Initial stock movements
  for (const p of products) {
    await prisma.stockMovement.create({
      data: { productId: p.id, type: "IN", quantity: p.quantity, reason: "Stock initial", userId: admin.id },
    });
  }

  // 30 random orders spread over the past 11 months
  const now = new Date();
  for (let i = 0; i < 30; i++) {
    const customerName = rand(NAMES);
    const product = rand(products);
    const qty = randInt(1, 3);
    const status = rand(STATUSES as unknown as string[]);
    const carrier = status === "PENDING" || status === "PREPARING" ? null : rand(CARRIERS);
    const tracking = carrier ? `TRK${randInt(100000000, 999999999)}` : null;
    const created = new Date(now.getTime() - randInt(0, 320) * 24 * 60 * 60 * 1000);

    const reference = `CMD-${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, "0")}${String(
      created.getDate()
    ).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const totalRevenue = product.salePrice * qty;
    const totalCost = product.costPrice * qty;
    const shippingCost = carrier ? randInt(4, 12) : 0;

    const orderCreated = await prisma.order.create({
      data: {
        reference,
        customerName,
        customerEmail: EMAILS(customerName),
        customerPhone: `+336${randInt(10000000, 99999999)}`,
        customerAddress: `${randInt(1, 200)} rue de la République, 75011 Paris`,
        status,
        carrier: carrier || undefined,
        trackingNumber: tracking || undefined,
        trackingUrl: tracking
          ? `https://suivi.exemple.com/${tracking}`
          : null,
        totalRevenue,
        totalCost,
        shippingCost,
        totalProfit: totalRevenue - totalCost - shippingCost,
        createdAt: created,
        updatedAt: created,
        createdById: admin.id,
        items: {
          create: [{
            productId: product.id,
            productName: product.name,
            quantity: qty,
            salePrice: product.salePrice,
            costPrice: product.costPrice,
          }],
        },
      },
    });

    if (status !== "CANCELLED") {
      await prisma.product.update({
        where: { id: product.id },
        data: { quantity: { decrement: qty } },
      });
    }

    // Auto-generate invoice
    const monthKey = `${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, "0")}`;
    const dueDate = new Date(created);
    dueDate.setDate(dueDate.getDate() + 30);
    await prisma.invoice.create({
      data: {
        number: `FAC-${monthKey}-${String(i + 1).padStart(4, "0")}`,
        orderId: orderCreated.id,
        customerName,
        customerEmail: EMAILS(customerName),
        customerPhone: `+336${randInt(10000000, 99999999)}`,
        customerAddress: `${randInt(1, 200)} rue de la République, 75011 Paris`,
        amountHT: totalRevenue,
        vatRate: 0,
        vatAmount: 0,
        amountTTC: totalRevenue,
        currency: "EUR",
        status: status === "CANCELLED" ? "CANCELLED" : status === "DELIVERED" ? "PAID" : "ISSUED",
        paidAt: status === "DELIVERED" ? created : null,
        dueDate,
        createdAt: created,
      },
    });
  }

  // Demo subscriptions
  const PLANS = [
    { plan: "BASIC", amount: 9.99 },
    { plan: "PRO", amount: 29.99 },
    { plan: "PREMIUM", amount: 79.99 },
  ];
  for (let i = 0; i < 8; i++) {
    const customerName = rand(NAMES);
    const p = rand(PLANS);
    const frequency = Math.random() > 0.7 ? "YEARLY" : "MONTHLY";
    const status = Math.random() > 0.85 ? "PAUSED" : "ACTIVE";
    const startDate = new Date(now.getTime() - randInt(0, 180) * 24 * 60 * 60 * 1000);
    const next = new Date(startDate);
    if (frequency === "YEARLY") next.setFullYear(next.getFullYear() + 1);
    else next.setMonth(next.getMonth() + 1);

    await prisma.subscription.create({
      data: {
        customerName,
        customerEmail: EMAILS(customerName),
        customerPhone: `+336${randInt(10000000, 99999999)}`,
        plan: p.plan,
        amount: frequency === "YEARLY" ? p.amount * 10 : p.amount,
        currency: "EUR",
        frequency,
        status,
        startDate,
        nextBillingDate: next,
      },
    });
  }

  await prisma.activityLog.create({
    data: { userId: admin.id, action: "SEED", entity: "System", meta: "Demo data created" },
  });

  console.log(`✅ Seed terminé.`);
  console.log(`   👑 Propriétaire : ${adminEmail} / ${adminPassword}  (sans paywall)`);
  console.log(`   👤 Client démo  : client@logistock.local / client123  (essai 14j)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
