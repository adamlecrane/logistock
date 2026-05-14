import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { PLAN_PRICE } from "@/lib/plan";

export default function LockedPage() {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="max-w-lg w-full card p-8 text-center border-2 border-primary/40 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative">
          <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-primary text-primary-foreground mb-6 shadow-lg">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Votre essai est terminé</h1>
          <p className="text-muted-foreground mt-3">
            Pour continuer à gérer vos commandes et votre stock, activez votre abonnement à <strong className="text-foreground">{PLAN_PRICE.toFixed(2)} € / mois</strong>.
          </p>

          <div className="mt-6 rounded-xl bg-primary/5 ring-1 ring-primary/20 p-4 text-left text-sm space-y-2">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Sparkles className="h-4 w-4" /> Ce qui vous attend
            </div>
            <ul className="text-muted-foreground space-y-1 pl-6 list-disc">
              <li>Commandes & stock illimités</li>
              <li>Suivi colis automatisé</li>
              <li>Convertisseur, abonnements clients, finances</li>
              <li>Sans engagement, annulable à tout moment</li>
            </ul>
          </div>

          <Link href="/billing" className="btn-primary w-full mt-6 h-12 text-base font-semibold">
            Activer mon abonnement
          </Link>
        </div>
      </div>
    </div>
  );
}
