"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const CURRENCIES = [
  { code: "USD", flag: "🇺🇸" },
  { code: "GBP", flag: "🇬🇧" },
  { code: "CHF", flag: "🇨🇭" },
  { code: "CAD", flag: "🇨🇦" },
  { code: "MAD", flag: "🇲🇦" },
  { code: "AED", flag: "🇦🇪" },
  { code: "TRY", flag: "🇹🇷" },
  { code: "CNY", flag: "🇨🇳" },
  { code: "INR", flag: "🇮🇳" },
  { code: "JPY", flag: "🇯🇵" },
  { code: "AUD", flag: "🇦🇺" },
  { code: "SEK", flag: "🇸🇪" },
  { code: "NOK", flag: "🇳🇴" },
  { code: "DKK", flag: "🇩🇰" },
  { code: "PLN", flag: "🇵🇱" },
  { code: "HKD", flag: "🇭🇰" },
  { code: "SGD", flag: "🇸🇬" },
  { code: "KRW", flag: "🇰🇷" },
  { code: "ZAR", flag: "🇿🇦" },
  { code: "BRL", flag: "🇧🇷" },
  { code: "RUB", flag: "🇷🇺" },
];

type Props = {
  /** Callback appelé avec le montant converti en EUR. */
  onConvert: (eurAmount: number) => void;
};

export function ShippingConverter({ onConvert }: Props) {
  const [from, setFrom] = useState("USD");
  const [amount, setAmount] = useState<number>(0);
  const [rate, setRate] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  async function loadRate(base: string) {
    setLoading(true);
    try {
      const r = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      const d = await r.json();
      if (d.result !== "success" || !d.rates?.EUR) {
        throw new Error("API error");
      }
      setRate(d.rates.EUR);
    } catch {
      toast.error("Impossible de charger le taux de change.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRate(from);
  }, [from]);

  const converted = amount * rate;

  function applyToShipping() {
    if (!converted || converted <= 0) {
      toast.error("Saisis un montant valide");
      return;
    }
    onConvert(+converted.toFixed(2));
    toast.success(`${converted.toFixed(2)} € appliqué`);
  }

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <label className="label text-xs">Convertir depuis une autre devise</label>
        <button
          type="button"
          onClick={() => loadRate(from)}
          className="btn-icon h-7 w-7"
          aria-label="Actualiser le taux"
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="flex gap-1">
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input w-20 px-2"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            min={0}
            placeholder="0"
            className="input flex-1"
            value={amount || ""}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          />
        </div>

        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

        <div className="input flex items-center justify-between bg-background">
          <span className="font-semibold text-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : converted.toFixed(2)}
          </span>
          <span className="text-xs text-muted-foreground">€</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>1 {from} = {rate.toFixed(4)} EUR</span>
        <button
          type="button"
          onClick={applyToShipping}
          disabled={loading || !converted}
          className="btn-secondary text-xs h-7 px-3"
        >
          Appliquer
        </button>
      </div>
    </div>
  );
}
