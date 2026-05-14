"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

type U = { id: string; name: string; email: string; role: string; createdAt: string };

export function UsersTable({ users }: { users: U[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });

  async function create() {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      return toast.error(j?.error?.toString?.() || "Erreur");
    }
    toast.success("Utilisateur créé");
    setOpen(false);
    setForm({ name: "", email: "", password: "", role: "STAFF" });
    router.refresh();
  }

  return (
    <>
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="btn-primary">
          <Plus className="h-4 w-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground bg-muted/30">
              <tr>
                <th className="py-3 px-5 font-medium">Nom</th>
                <th className="py-3 px-5 font-medium">Email</th>
                <th className="py-3 px-5 font-medium">Rôle</th>
                <th className="py-3 px-5 font-medium">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-border/60 table-row-hover">
                  <td className="py-3 px-5 font-medium">{u.name}</td>
                  <td className="py-3 px-5">{u.email}</td>
                  <td className="py-3 px-5">
                    <span className="badge bg-secondary text-secondary-foreground ring-border">{u.role}</span>
                  </td>
                  <td className="py-3 px-5 text-muted-foreground">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-fade-in">
          <div className="w-full max-w-md card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nouvel utilisateur</h3>
              <button onClick={() => setOpen(false)} className="btn-icon"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="label">Nom</label>
                <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="label">Email</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="label">Mot de passe</label>
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="label">Rôle</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpen(false)} className="btn-secondary">Annuler</button>
              <button onClick={create} className="btn-primary">Créer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
