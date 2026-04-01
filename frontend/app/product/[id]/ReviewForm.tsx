"use client";

import { useState } from "react";
import Link from "next/link";

const ACCESS_KEY = "gm_access";

export default function ReviewForm({
  productId,
  onCreated,
}: {
  productId: number;
  onCreated: () => void;
}) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");

    const token = localStorage.getItem(ACCESS_KEY);
    if (!token) {
      setMsg("❌ Debes iniciar sesión para escribir una reseña.");
      return;
    }

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

      const res = await fetch(`${apiBase}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product: productId,
          rating,
          comment,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setMsg("✅ Reseña enviada. Puede quedar pendiente de verificación/moderación.");
      setComment("");
      setRating(5);

      // Recargar lista
      onCreated();
    } catch (e: any) {
      setMsg(`❌ ${e?.message || "Error creando reseña"}`);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border p-4">
      <h3 className="text-lg font-semibold">Escribir una reseña</h3>
      <p className="text-sm text-slate-600 mt-1">
        Debes iniciar sesión. Si tu compra no está “entregada”, puede quedar como no verificada o en moderación.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <label className="block text-sm">
          Rating
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            <option value={5}>5 - Excelente</option>
            <option value={4}>4 - Muy bueno</option>
            <option value={3}>3 - Bueno</option>
            <option value={2}>2 - Regular</option>
            <option value={1}>1 - Malo</option>
          </select>
        </label>

        <label className="block text-sm">
          Comentario
          <textarea
            className="mt-1 w-full rounded-xl border px-3 py-2"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Cuéntanos tu experiencia…"
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="rounded-xl bg-slate-900 px-4 py-3 text-white hover:bg-slate-800">
            Enviar reseña
          </button>

          <Link
            className="rounded-xl border px-4 py-3 text-center hover:bg-slate-50"
            href="/login"
          >
            Iniciar sesión
          </Link>
        </div>
      </form>

      {msg && <p className="mt-3 text-sm whitespace-pre-wrap">{msg}</p>}
    </div>
  );
}