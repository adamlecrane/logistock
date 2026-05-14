import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const o = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true },
  });
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<title>Facture ${o.reference}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif; margin: 0; padding: 40px; color: #111; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:24px; border-bottom: 3px solid #E10600; }
  .brand { font-size: 22px; font-weight: 700; }
  .meta { text-align:right; font-size: 14px; color:#444; }
  h2 { margin: 24px 0 8px; font-size: 16px; }
  .row { display:flex; gap:32px; margin-top: 16px; }
  .row > div { flex:1; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; }
  th, td { padding: 10px 8px; border-bottom: 1px solid #ddd; text-align: left; }
  th { background: #fafafa; }
  td.num, th.num { text-align: right; }
  .totals { margin-top: 16px; margin-left: auto; width: 320px; font-size: 14px; }
  .totals .line { display:flex; justify-content:space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid #111; font-weight: 700; margin-top: 6px; padding-top: 10px; }
  .footer { margin-top:48px; font-size: 12px; color:#666; }
  @media print { body { padding: 24px; } .no-print { display:none; } }
</style></head><body>
<button class="no-print" onclick="window.print()" style="position:fixed;top:20px;right:20px;padding:8px 14px;border-radius:8px;border:1px solid #ccc;background:#fff;cursor:pointer;">Imprimer / PDF</button>

<div class="header">
  <div>
    <div class="brand" style="color:#E10600;font-weight:900;letter-spacing:-0.02em;">LogiStock</div>
    <div style="color:#666;font-size:13px;">Plateforme de gestion</div>
  </div>
  <div class="meta">
    <div><strong>Facture ${o.reference}</strong></div>
    <div>${formatDate(o.createdAt)}</div>
  </div>
</div>

<div class="row">
  <div>
    <h2>Facturé à</h2>
    <div>${escape(o.customerName)}</div>
    ${o.customerEmail ? `<div>${escape(o.customerEmail)}</div>` : ""}
    ${o.customerPhone ? `<div>${escape(o.customerPhone)}</div>` : ""}
    ${o.customerAddress ? `<div style="white-space:pre-line">${escape(o.customerAddress)}</div>` : ""}
  </div>
  <div>
    <h2>Détails</h2>
    <div>Statut : ${o.status}</div>
    ${o.carrier ? `<div>Transporteur : ${o.carrier}</div>` : ""}
    ${o.trackingNumber ? `<div>N° de suivi : ${escape(o.trackingNumber)}</div>` : ""}
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Produit</th>
      <th class="num">Qté</th>
      <th class="num">Prix unitaire</th>
      <th class="num">Total</th>
    </tr>
  </thead>
  <tbody>
    ${o.items
      .map(
        (i) => `
      <tr>
        <td>${escape(i.productName)}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${formatCurrency(i.salePrice)}</td>
        <td class="num">${formatCurrency(i.salePrice * i.quantity)}</td>
      </tr>`
      )
      .join("")}
  </tbody>
</table>

<div class="totals">
  <div class="line"><span>Sous-total</span><span>${formatCurrency(o.totalRevenue)}</span></div>
  <div class="line grand"><span>Total à payer</span><span>${formatCurrency(o.totalRevenue)}</span></div>
</div>

<div class="footer">Merci pour votre confiance.</div>

<script>setTimeout(()=>window.print(), 300);</script>
</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string
  ));
}
