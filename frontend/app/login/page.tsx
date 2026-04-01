"use client";

import { useState } from "react";
import Link from "next/link";
import { saveTokens } from "../../lib/auth";
import { API_BASE } from "../../lib/http";

const TOKEN_URL = `${API_BASE}/auth/login/`;

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    try {
      const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) throw new Error(await res.text());

      // Espera { access, refresh }
      const data = await res.json();
      saveTokens({ access: data.access, refresh: data.refresh });

      setMsg("✅ Login ok. Ya puedes dejar reseñas.");
    } catch (err: any) {
      setMsg(`❌ ${err?.message || "Error"}`);
    }
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-md px-4 py-10">
        <Link href="/" className="text-sm text-slate-600 hover:underline">
          ← Volver
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">Iniciar sesión</h1>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-800">
            Entrar
          </button>
        </form>

        {msg && (
          <p className="mt-4 text-sm text-slate-700 whitespace-pre-wrap">
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}