import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const inv = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { order: { include: { items: true, createdBy: true } } },
  });
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Récupère le branding du créateur de la commande, sinon celui de l'utilisateur courant
  let branding = inv.order?.createdBy;
  if (!branding) {
    branding = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
    });
  }

  const brandName = branding?.brandName || "LogiStock";
  const brandLogo = branding?.brandLogoUrl || "";
  const brandEmail = branding?.brandEmail || "";
  const brandPhone = branding?.brandPhone || "";
  const brandAddress = branding?.brandAddress || "";
  const brandLegal = branding?.brandLegalInfo || "";
  const primary = branding?.brandPrimaryColor || "#E10600";

  const items = inv.order?.items ?? [];
  const statusLabel =
    inv.status === "PAID" ? "PAYÉE" : inv.status === "CANCELLED" ? "ANNULÉE" : "À RÉGLER";
  const statusColor =
    inv.status === "PAID" ? "#16a34a" : inv.status === "CANCELLED" ? "#999" : primary;

  // Si pas de nom de marque personnalisé, garde le wordmark stylisé "LogiStock"
  const brandHeader = branding?.brandName
    ? `<div class="brand">${escape(brandName)}</div>`
    : `<div class="brand">Logi<span class="black">Stock</span></div>`;

  const html = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"/>
<title>Facture ${inv.number}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, sans-serif; margin: 0; padding: 40px; color: #111; background: #fff; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:24px; border-bottom: 3px solid ${primary}; gap: 24px; }
  .header-left { display:flex; align-items:center; gap: 16px; }
  .logo { max-height: 80px; max-width: 180px; object-fit: contain; }
  .brand { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; color: ${primary}; }
  .brand .black { color: #111; }
  .seller { font-size: 11px; color:#555; margin-top: 6px; line-height: 1.5; white-space: pre-line; }
  .subtitle { font-size: 12px; color:#666; margin-top: 2px; letter-spacing: 1px; text-transform: uppercase; }
  .meta { text-align:right; font-size: 13px; color:#444; line-height: 1.7; }
  .meta .invoice-num { font-size: 22px; font-weight: 800; color: #111; }
  .stamp { display:inline-block; margin-top:8px; padding:6px 14px; border:2px solid ${statusColor}; color:${statusColor}; font-weight:800; border-radius: 6px; letter-spacing: 1px; }
  h2 { margin: 24px 0 8px; font-size: 13px; text-transform: uppercase; color: ${primary}; letter-spacing: 1.5px; }
  .row { display:flex; gap:32px; margin-top: 8px; }
  .row > div { flex:1; }
  table { width: 100%; border-collapse: collapse; margin-top: 28px; font-size: 14px; }
  th, td { padding: 10px 8px; border-bottom: 1px solid #eee; text-align: left; }
  th { background: #fafafa; font-weight: 600; color:#444; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
  td.num, th.num { text-align: right; }
  .totals { margin-top: 16px; margin-left: auto; width: 360px; font-size: 14px; }
  .totals .line { display:flex; justify-content:space-between; padding: 6px 0; }
  .totals .grand { border-top: 2px solid #111; font-weight: 800; margin-top: 6px; padding-top: 10px; font-size: 16px; color: ${primary}; }
  .footer { margin-top:48px; font-size: 11px; color:#666; border-top: 1px solid #eee; padding-top: 16px; }
  .notes { margin-top: 24px; padding: 14px; background: #fafafa; border-left: 3px solid ${primary}; font-size: 13px; color: #444; border-radius: 4px; }
  @media print { body { padding: 24px; } .no-print { display:none; } }
</style></head><body>

<button class="no-print" onclick="window.print()" style="position:fixed;top:20px;right:20px;padding:10px 18px;border-radius:8px;border:1px solid #ccc;background:${primary};color:white;cursor:pointer;font-weight:600;">📄 Imprimer / PDF</button>

<div class="header">
  <div class="header-left">
    ${brandLogo ? `<img class="logo" src="${escape(brandLogo)}" alt="${escape(brandName)}"/>` : ""}
    <div>
      ${brandHeader}
      ${brandAddress || brandEmail || brandPhone ? `<div class="seller">${[
        escape(brandAddress || ""),
        brandEmail ? escape(brandEmail) : "",
        brandPhone ? escape(brandPhone) : "",
      ].filter(Boolean).join("\n")}</div>` : `<div class="subtitle">Plateforme de gestion</div>`}
    </div>
  </div>
  <div class="meta">
    <div class="invoice-num">FACTURE</div>
    <div><strong>${inv.number}</strong></div>
    <div>Émise le ${formatDate(inv.createdAt)}</div>
    ${inv.dueDate ? `<div>Échéance : ${formatDate(inv.dueDate)}</div>` : ""}
    ${inv.paidAt ? `<div>Réglée le ${formatDate(inv.paidAt)}</div>` : ""}
    <div class="stamp">${statusLabel}</div>
  </div>
</div>

<div class="row">
  <div>
    <h2>Facturé à</h2>
    <div style="font-weight:600;">${escape(inv.customerName)}</div>
    ${inv.customerEmail ? `<div>${escape(inv.customerEmail)}</div>` : ""}
    ${inv.customerPhone ? `<div>${escape(inv.customerPhone)}</div>` : ""}
    ${inv.customerAddress ? `<div style="white-space:pre-line">${escape(inv.customerAddress)}</div>` : ""}
  </div>
  <div>
    <h2>Référence</h2>
    ${inv.order ? `<div>Commande : <strong>${inv.order.reference}</strong></div>` : ""}
    <div>Devise : ${inv.currency}</div>
    ${inv.vatRate > 0 ? `<div>TVA : ${inv.vatRate}%</div>` : `<div>TVA non applicable, art. 293 B du CGI</div>`}
  </div>
</div>

${items.length > 0 ? `
<table>
  <thead>
    <tr>
      <th>Produit / Service</th>
      <th class="num">Qté</th>
      <th class="num">Prix unitaire HT</th>
      <th class="num">Total HT</th>
    </tr>
  </thead>
  <tbody>
    ${items.map((i) => `
      <tr>
        <td>${escape(i.productName)}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${formatCurrency(i.salePrice, inv.currency)}</td>
        <td class="num">${formatCurrency(i.salePrice * i.quantity, inv.currency)}</td>
      </tr>`).join("")}
  </tbody>
</table>` : `
<table>
  <thead>
    <tr>
      <th>Description</th>
      <th class="num">Total HT</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Prestation</td>
      <td class="num">${formatCurrency(inv.amountHT, inv.currency)}</td>
    </tr>
  </tbody>
</table>`}

<div class="totals">
  <div class="line"><span>Total HT</span><span>${formatCurrency(inv.amountHT, inv.currency)}</span></div>
  ${inv.vatRate > 0 ? `<div class="line"><span>TVA (${inv.vatRate}%)</span><span>${formatCurrency(inv.vatAmount, inv.currency)}</span></div>` : ""}
  <div class="line grand"><span>Total TTC</span><span>${formatCurrency(inv.amountTTC, inv.currency)}</span></div>
</div>

${inv.notes ? `<div class="notes"><strong>Notes :</strong><br/>${escape(inv.notes)}</div>` : ""}

<div class="footer">
  Conditions de règlement : paiement à réception de facture.
  En cas de retard, application d'une pénalité de 3 fois le taux d'intérêt légal et indemnité forfaitaire de 40 €.
  ${brandLegal ? `<br/><br/>${escape(brandLegal)}` : ""}
  <br/><br/>
  <strong>${escape(brandName)}</strong> · Document généré automatiquement
</div>

</body></html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
