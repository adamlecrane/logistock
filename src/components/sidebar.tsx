"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Truck,
  TrendingUp,
  Users,
  Activity,
  X,
  ArrowLeftRight,
  CreditCard,
  Sparkles,
  FileText,
  Palette,
} from "lucide-react";

// Items visibles par tous les utilisateurs connectés
const nav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/orders", label: "Commandes", icon: ShoppingCart },
  { href: "/invoices", label: "Factures", icon: FileText },
  { href: "/products", label: "Stock", icon: Boxes },
  { href: "/tracking", label: "Suivi colis", icon: Truck },
  { href: "/converter", label: "Convertisseur", icon: ArrowLeftRight },
  { href: "/finance", label: "Finances", icon: TrendingUp },
  { href: "/activity", label: "Activité", icon: Activity },
];

// Items réservés au propriétaire (rôle OWNER)
const ownerOnlyNav = [
  { href: "/subscriptions", label: "Abonnements clients", icon: CreditCard },
  { href: "/users", label: "Utilisateurs", icon: Users },
];

const accountNav = [
  { href: "/settings/branding", label: "Personnalisation", icon: Palette },
  { href: "/billing", label: "Mon abonnement", icon: Sparkles },
];

export function Sidebar({ open, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";
  const items = isOwner ? [...nav, ...ownerOnlyNav] : nav;
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed lg:sticky lg:top-0 inset-y-0 left-0 z-50 w-64 shrink-0 border-r border-border bg-card flex flex-col h-screen transition-transform",
          "pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-20 flex items-center justify-between px-4 border-b border-border bg-black">
          <Link href="/dashboard" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.svg"
              alt="LogiStock"
              className="h-12 w-12 rounded-lg"
            />
            <span className="text-white font-black tracking-tight leading-none">
              <span className="text-lg block">
                Logi<span className="text-primary">Stock</span>
              </span>
              <span className="text-[10px] text-white/60 block tracking-widest uppercase">
                Plateforme
              </span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden btn-icon text-white" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-border space-y-0.5">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-1">
              Mon compte
            </div>
            {accountNav.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
          <span className="text-primary font-semibold">LogiStock</span> · v1.0
        </div>
      </aside>
    </>
  );
}
