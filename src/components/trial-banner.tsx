import Link from "next/link";
import { Sparkles, Clock } from "lucide-react";

export function TrialBanner({ daysLeft, cancelled }: { daysLeft: number; cancelled?: boolean }) {
  return (
    <div className="mb-4 rounded-xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
          {cancelled ? <Clock className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </span>
        <div className="text-sm">
          {cancelled ? (
            <>
              <strong className="text-foreground">Abonnement annulé</strong> —{" "}
              {daysLeft > 0
                ? `vous gardez l'accès encore ${daysLeft} jour${daysLeft > 1 ? "s" : ""}.`
                : "votre accès va expirer."}
            </>
          ) : (
            <>
              <strong className="text-foreground">Essai gratuit</strong> — il vous reste{" "}
              <strong className="text-primary">{daysLeft} jour{daysLeft > 1 ? "s" : ""}</strong>. Activez votre abonnement pour ne pas perdre l'accès.
            </>
          )}
        </div>
      </div>
      <Link href="/billing" className="btn-primary text-sm shrink-0">
        {cancelled ? "Réactiver" : "Activer maintenant"}
      </Link>
    </div>
  );
}
