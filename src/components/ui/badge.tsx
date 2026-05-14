import { cn } from "@/lib/utils";
import { getStatusMeta } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const meta = getStatusMeta(status);
  return <span className={cn("badge", meta.color)}>{meta.label}</span>;
}
