"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("admin@logistock.local");
  const [password, setPassword] = useState("admin123");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) {
      toast.error("Identifiants invalides");
      return;
    }
    toast.success("Connexion réussie");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panneau gauche — fond rouge avec logo */}
      <div className="hidden lg:flex flex-col justify-between p-10 ad-waves text-white relative overflow-hidden">
        {/* SVG ondes en arrière-plan */}
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
            LOGISTOCK
          </h1>
          <p className="mt-3 max-w-md text-white/85">
            Plateforme de gestion — commandes, stock & suivi colis.
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
          <h2 className="text-2xl font-bold tracking-tight">Connexion</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Bienvenue, connectez-vous pour continuer.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-base font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
            <strong className="text-primary">Compte démo</strong> — admin@logistock.local / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
