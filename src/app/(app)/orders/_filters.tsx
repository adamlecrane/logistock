"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ORDER_STATUSES } from "@/lib/utils";
import { Search } from "lucide-react";

export function OrdersFilters({
  defaultQ,
  defaultStatus,
}: {
  defaultQ: string;
  defaultStatus: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(defaultQ);
  const [status, setStatus] = useState(defaultStatus);

  useEffect(() => {
    const t = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (q) sp.set("q", q);
      else sp.delete("q");
      if (status && status !== "ALL") sp.set("status", status);
      else sp.delete("status");
      sp.delete("page");
      router.replace(`/orders?${sp.toString()}`);
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status]);

  return (
    <div className="card p-3 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (référence, client, email, tracking)..."
          className="input pl-9"
        />
      </div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="input sm:w-56"
      >
        <option value="ALL">Tous les statuts</option>
        {ORDER_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}
