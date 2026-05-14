"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function AlphabetBar({ active }: { active?: string }) {
  const searchParams = useSearchParams();

  function buildHref(letter: string | null) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (letter) params.set("letter", letter);
    else params.delete("letter");
    params.delete("page");
    const qs = params.toString();
    return `/orders${qs ? `?${qs}` : ""}`;
  }

  const current = (active || "").toUpperCase();

  return (
    <div className="card p-2 flex items-center gap-1 overflow-x-auto">
      <Link
        href={buildHref(null)}
        className={cn(
          "shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
          !current
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        Tous
      </Link>
      <div className="h-5 w-px bg-border mx-1 shrink-0" />
      {LETTERS.map((l) => {
        const isActive = current === l;
        return (
          <Link
            key={l}
            href={buildHref(l)}
            className={cn(
              "shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md text-xs font-semibold transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {l}
          </Link>
        );
      })}
      <div className="h-5 w-px bg-border mx-1 shrink-0" />
      <Link
        href={buildHref("#")}
        className={cn(
          "shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-md text-xs font-semibold transition-colors",
          current === "#"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
        title="Chiffres / autres"
      >
        #
      </Link>
    </div>
  );
}
