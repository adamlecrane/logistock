"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 6) {
      toast.error("Mot de passe trop court (min. 6 caractères)");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.error || "Erreur lors de l'inscription");
      setLoading(false);
      return;
    }
    // Auto-login après inscription
    const login = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (login?.error) {
      toast.error("Inscription réussie, mais connexion impossible. Connecte-toi manuellement.");
      router.push("/login");
      return;
    }
    toast.success("Bienvenue sur LogiStock !");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panneau gauche — fond rouge avec logo */}
      <div className="hidden lg:flex flex-col justify-between p-10 ad-waves text-white relative overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 800 800"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <pattern id="waves" x="0" y="0" width="800" height="200" patternUnits="userSpaceOnUse">
              <path
                d="M0,100 C150,30 350,170 500,100 C650,30 750,150 800,100"
                fill="none"
                stroke="white"
                strokeOpacity="0.25"
                strokeWidth="3"
              />
            </pattern>
          </defs>
          <rect width="800" height="800" fill="url(#waves)" />
          <rect width="800" height="800" fill="url(#waves)" transform="translate(0,150)" />
          <rect width="800" height="800" fill="url(#waves)" transform="translate(0,300)" />
          <rect width="800" height="800" fill="url(#waves)" transform="translate(0,450)" />
          <rect width="800" height="800" fill="url(#waves)" transform="translate(0,600)" />
        </svg>

        <div className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="LogiStock" className="h-12 w-12 rounded-lg" />
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tight">LogiStock</div>
            <div className="text-[10px] font-bold tracking-[0.25em]">PLATEFORME</div>
          </div>
        </div>

        <div className="relative flex flex-col items-center text-center -mt-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="LogiStock"
            className="w-72 h-72 rounded-3xl shadow-2xl ring-4 ring-white/20"
          />
          <h1 className="mt-8 text-5xl font-black tracking-tight brand-title">
            ESSAI GRATUIT
          </h1>
          <p className="mt-3 max-w-md text-white/85">
            10 jours d'essai offerts. Sans carte bancaire. Puis 9,99 € / mois.
          </p>
        </div>

        <p className="relative text-xs text-white/70">© {new Date().getFullYear()} LogiStock</p>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md card p-8 animate-fade-in border-t-4 border-t-primary">
          <div className="mb-6 lg:hidden flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="" className="h-10 w-10 rounded-lg" />
            <div>
              <div className="font-black tracking-tight">
                Logi<span className="text-primary">Stock</span>
              </div>
              <div className="text-[10px] tracking-widest text-muted-foreground uppercase">Plateforme</div>
            </div>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Créer un compte</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Commencez votre essai gratuit de 10 jours.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="label" htmlFor="name">Nom complet</label>
              <input
                id="name"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="password">Mot de passe</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="confirm">Confirmer le mot de passe</label>
              <input
                id="confirm"
                type="password"
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-base font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Démarrer l'essai gratuit"}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            <strong className="text-primary">10 jours gratuits</strong> — Sans carte bancaire requise.
            Au-delà : 9,99 € / mois.
          </div>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
