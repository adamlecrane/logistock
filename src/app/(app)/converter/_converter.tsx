"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, RefreshCw, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

const CURRENCIES = [
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "USD", name: "Dollar US", flag: "🇺🇸" },
  { code: "GBP", name: "Livre Sterling", flag: "🇬🇧" },
  { code: "CHF", name: "Franc Suisse", flag: "🇨🇭" },
  { code: "CAD", name: "Dollar Canadien", flag: "🇨🇦" },
  { code: "AUD", name: "Dollar Australien", flag: "🇦🇺" },
  { code: "JPY", name: "Yen Japonais", flag: "🇯🇵" },
  { code: "CNY", name: "Yuan Chinois", flag: "🇨🇳" },
  { code: "MAD", name: "Dirham Marocain", flag: "🇲🇦" },
  { code: "AED", name: "Dirham Émirati", flag: "🇦🇪" },
  { code: "TRY", name: "Lire Turque", flag: "🇹🇷" },
  { code: "INR", name: "Roupie Indienne", flag: "🇮🇳" },
  { code: "BRL", name: "Real Brésilien", flag: "🇧🇷" },
  { code: "RUB", name: "Rouble Russe", flag: "🇷🇺" },
  { code: "ZAR", name: "Rand Sud-Africain", flag: "🇿🇦" },
  { code: "SEK", name: "Couronne Suédoise", flag: "🇸🇪" },
  { code: "NOK", name: "Couronne Norvégienne", flag: "🇳🇴" },
  { code: "DKK", name: "Couronne Danoise", flag: "🇩🇰" },
  { code: "PLN", name: "Zloty Polonais", flag: "🇵🇱" },
  { code: "HKD", name: "Dollar de Hong Kong", flag: "🇭🇰" },
  { code: "SGD", name: "Dollar de Singapour", flag: "🇸🇬" },
  { code: "KRW", name: "Won Sud-Coréen", flag: "🇰🇷" },
];

export function Converter() {
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState<number>(100);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  async function loadRates(base: string) {
    setLoading(true);
    try {
      // Free reliable API — open.er-api.com — no key, no rate limit
      const r = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const d = await r.json();
      if (d.result !== "success" || !d.rates) {
        throw new Error("API error");
      }
      setRates(d.rates);
      setUpdatedAt(
        d.time_last_update_utc
          ? new Date(d.time_last_update_utc).toLocaleDateString("fr-FR")
          : new Date().toLocaleDateString("fr-FR")
      );
    } catch (e) {
      toast.error("Impossible de charger les taux. Vérifiez votre connexion internet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRates(from);
  }, [from]);

  const rate = rates?.[to] ?? 0;
  const result = useMemo(() => amount * rate, [amount, rate]);

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <>
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          {/* From */}
          <div className="space-y-3">
            <label className="label">De</label>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="input"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              className="input text-2xl font-bold h-14"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            />
          </div>

          {/* Swap */}
          <button
            onClick={swap}
            className="btn-icon h-12 w-12 bg-primary text-primary-foreground hover:opacity-90 mt-7"
            aria-label="Inverser"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </button>

          {/* To */}
          <div className="space-y-3">
            <label className="label">Vers</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="input"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>
              ))}
            </select>
            <div className="input h-14 text-2xl font-bold flex items-center bg-muted/40 text-primary">
              {loading ? "..." : result.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span>
              <strong className="text-foreground">1 {from}</strong> = {rate.toFixed(4)} {to}
              {updatedAt && <span className="ml-2 text-xs">· Mis à jour le {updatedAt}</span>}
            </span>
          </div>
          <button onClick={() => loadRates(from)} className="btn-ghost text-xs" disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      {/* Quick reference table */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="font-semibold">Taux principaux depuis {from}</h3>
          <p className="text-xs text-muted-foreground">Aperçu rapide pour les devises courantes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Devise</th>
                <th className="py-3 px-5 font-medium">Taux pour 1 {from}</th>
                <th className="py-3 px-5 font-medium">Pour {amount} {from}</th>
              </tr>
            </thead>
            <tbody>
              {CURRENCIES.filter((c) => c.code !== from).slice(0, 12).map((c) => {
                const r = rates?.[c.code] ?? 0;
                return (
                  <tr key={c.code} className="border-t border-border/60 table-row-hover">
                    <td className="py-3 px-5 font-medium">{c.flag} {c.code} — {c.name}</td>
                    <td className="py-3 px-5">{r.toFixed(4)}</td>
                    <td className="py-3 px-5 text-primary font-semibold">
                      {(amount * r).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
