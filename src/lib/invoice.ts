import { prisma } from "@/lib/prisma";

export const DEFAULT_VAT_RATE = 0; // 0 = pas de TVA (auto-entrepreneur). Mettez 20 pour 20%.
export const PAYMENT_DUE_DAYS = 30;

export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prefix = `FAC-${ym}-`;

  // Find last invoice of this month
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  let next = 1;
  if (last) {
    const tail = last.number.slice(prefix.length);
    const parsed = parseInt(tail, 10);
    if (!isNaN(parsed)) next = parsed + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export function computeInvoiceTotals(amountHT: number, vatRate: number) {
  const vatAmount = +(amountHT * (vatRate / 100)).toFixed(2);
  const amountTTC = +(amountHT + vatAmount).toFixed(2);
  return { amountHT: +amountHT.toFixed(2), vatAmount, amountTTC };
}
