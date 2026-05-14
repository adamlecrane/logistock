import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: number; positive?: boolean };
  className?: string;
}) {
  return (
    <div className={cn("card p-5 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {Icon && (
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight">{value}</div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {trend && (
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 ring-1 ring-inset font-medium",
              trend.positive
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/30"
                : "bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/30"
            )}
          >
            {trend.positive ? "+" : ""}
            {trend.value}%
          </span>
        )}
        {hint && <span>{hint}</span>}
      </div>
    </div>
  );
}
